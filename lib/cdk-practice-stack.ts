import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { SchedulerStack } from './scheduler-stack';
import { CfnScheduleGroup } from 'aws-cdk-lib/aws-scheduler';
import { ComputingStack } from './computing-stack';

interface StageContext {
  vpcId: string,
  availabilityZone: string,
  publicSubnetId: string,
  publicSubnetRouteTableId: string,
  ami: string,
  startInstanceSchedule: string,
  stopInstanceSchedule: string,
  scheduleTimeZone: string,
}

export class CdkPracticeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    if(props == null || props.env == null){
      throw new Error('need argument');
    }

    const stage : 'dev' | 'prd' = this.node.tryGetContext('stage');
    const context : StageContext = this.node.tryGetContext(stage);

    // VPC(既存のVPCをインポート)
    const vpc = Vpc.fromVpcAttributes(this, 'VPC', {
      vpcId: context.vpcId,
      availabilityZones: [context.availabilityZone],
      publicSubnetIds: [context.publicSubnetId],
      publicSubnetRouteTableIds: [context.publicSubnetId],
    });

    // 定期的な処理を実行するEC2インスタンス
    const computing = new ComputingStack(this, 'ComputingStack', {
      region: props.env.region!,
      accountId: props.env.account!,
      vpc: vpc,
      ami: context.ami,
    });

    // EventBridge Scheduler
    new SchedulerStack(this, 'EventBridgeScheduler', {
      region: props!.env!.region as string,
      accountId: props!.env!.account as string,
      schedulerGroup: new CfnScheduleGroup(this, 'ScheduleGroup', {name: 'Schedulers'}),
      ec2Instance: computing.instance,
      startInstanceSchedule: context.startInstanceSchedule,
      stopInstanceSchedule: context.stopInstanceSchedule,
      scheduleTimeZone: context.scheduleTimeZone,
    });
  }
}
