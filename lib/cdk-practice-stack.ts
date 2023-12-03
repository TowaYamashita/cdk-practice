import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  MachineImage,
  SecurityGroup,
  Peer,
  Port,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import { SchedulerStack } from './scheduler-stack';
import { CfnScheduleGroup } from 'aws-cdk-lib/aws-scheduler';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';

export class CdkPracticeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    if(props == null || props.env == null){
      throw new Error('need argument');
    }

    // VPC(既存のVPCをインポート)
    const vpc = Vpc.fromVpcAttributes(this, 'VPC', {
      vpcId: 'vpc-0985df2161728f4ee',
      availabilityZones: ['us-east-1d'],
      publicSubnetIds: ['subnet-087b2ffed59433e41'],
      publicSubnetRouteTableIds: ['rtb-03f24092df045b118'],
    });

    // セキュリティグループ
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      Peer.anyIpv4(), 
      Port.icmpPing(),
      'allow ping from anywhere'
    );

    // インスタンスプロファイル
    const ec2Role = new Role(this, 'Ec2InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });
    ec2Role.addToPolicy(new PolicyStatement({
      resources: [
        `arn:aws:ssm:${props!.env!.region}:${props!.env!.account}:parameter/*`,
      ],
      effect: Effect.ALLOW,
      actions: [
        'ssm:GetParameters',
      ]
    }));

    // ユーザデータ
    const userData = UserData.forLinux();
    const userDataScript = readFileSync('assets/ec2/user-data.sh', 'utf-8').toString();
    userData.addCommands(userDataScript);

    // EC2インスタンス
    const instance = new Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO,),
      machineImage: MachineImage.genericLinux({
        'us-east-1': 'ami-0230bd60aa48260c6',
      }),
      role: ec2Role,
      ssmSessionPermissions: true,
      securityGroup: securityGroup,
      userData: userData,
    });

    // EventBridge Scheduler
    new SchedulerStack(this, 'EventBridgeScheduler', {
      schedulerGroup: new CfnScheduleGroup(this, 'ScheduleGroup', {name: 'Schedulers'}),
      ec2Instance: instance,
      region: props!.env!.region as string,
      accountId: props!.env!.account as string,
    });
  }
}
