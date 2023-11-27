import { Construct } from "constructs";
import { CfnSchedule, type CfnScheduleGroup } from "aws-cdk-lib/aws-scheduler";
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { type Instance } from "aws-cdk-lib/aws-ec2";

interface SchedulerProps {
  schedulerGroup: CfnScheduleGroup,
  ec2Instance: Instance,
  region: string,
  accountId: string,
}

export class SchedulerStack extends Construct {
  constructor(scope: Construct, id: string, {schedulerGroup, ec2Instance, region, accountId}: SchedulerProps){
    super(scope, id);

    const schedulerRole = new Role(this, 'SchedulerRole', {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
    });

    new Policy(this, 'SchedulerPolicy', {
      policyName: 'EC2StartStop',
      roles: [schedulerRole],
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ec2:startInstances', 'ec2:stopInstances'],
          resources: [
            `arn:aws:ec2:${region}:${accountId}:instance/${ec2Instance.instance.ref}`,
          ],
        }),
      ]
    });

    new CfnSchedule(this, 'Ec2Start', {
      groupName: schedulerGroup.name,
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpressionTimezone: 'Asia/Tokyo',
      scheduleExpression: 'cron(00 09 ? * MON-FRI *)',
      target: {
        arn: 'arn:aws:scheduler:::aws-sdk:ec2:startInstances',
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({InstanceIds: [ec2Instance.instanceId]}),
      },
    });

    new CfnSchedule(this, 'Ec2Stop', {
      groupName: schedulerGroup.name,
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpressionTimezone: 'Asia/Tokyo',
      scheduleExpression: 'cron(00 18 ? * MON-FRI *)',
      target: {
        arn: 'arn:aws:scheduler:::aws-sdk:ec2:stopInstances',
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({ InstanceIds: [ec2Instance.instanceId]}),
      },
    });
  }
}