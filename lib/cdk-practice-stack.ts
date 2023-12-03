import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc,
  SecurityGroup,
  Peer,
  Port,
} from 'aws-cdk-lib/aws-ec2';
import { SchedulerStack } from './scheduler-stack';
import { CfnScheduleGroup } from 'aws-cdk-lib/aws-scheduler';
import { ComputingStack } from './computing-stack';

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

    const computing = new ComputingStack(this, 'ComputingStack', {
      region: props.env.region!,
      accountId: props.env.account!,
      vpc: vpc,
      securityGroup: securityGroup,

    });

    // EventBridge Scheduler
    new SchedulerStack(this, 'EventBridgeScheduler', {
      schedulerGroup: new CfnScheduleGroup(this, 'ScheduleGroup', {name: 'Schedulers'}),
      ec2Instance: computing.instance,
      region: props!.env!.region as string,
      accountId: props!.env!.account as string,
    });
  }
}
