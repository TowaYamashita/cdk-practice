import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  MachineImage} from 'aws-cdk-lib/aws-ec2';
import { SchedulerStack } from './scheduler-stack';
import { CfnScheduleGroup } from 'aws-cdk-lib/aws-scheduler';

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

    // EC2インスタンス
    const instance = new Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO,),
      machineImage: MachineImage.genericLinux({
        'us-east-1': 'ami-0230bd60aa48260c6',
      })
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
