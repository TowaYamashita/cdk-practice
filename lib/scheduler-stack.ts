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
  region: string,
  accountId: string,
  schedulerGroup: CfnScheduleGroup,
  ec2Instance: Instance,
  startInstanceSchedule: string,
  stopInstanceSchedule: string,
  scheduleTimeZone: string,
}

export class SchedulerStack extends Construct {
  constructor(scope: Construct, id: string, props: SchedulerProps){
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
            `arn:aws:ec2:${props.region}:${props.accountId}:instance/${props.ec2Instance.instance.ref}`,
          ],
        }),
      ]
    });

    new CfnSchedule(this, 'Ec2Start', {
      groupName: props.schedulerGroup.name,
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpressionTimezone: props.scheduleTimeZone,
      scheduleExpression: props.startInstanceSchedule,
      target: {
        arn: 'arn:aws:scheduler:::aws-sdk:ec2:startInstances',
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({InstanceIds: [props.ec2Instance.instanceId]}),
      },
    });

    new CfnSchedule(this, 'Ec2Stop', {
      groupName: props.schedulerGroup.name,
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpressionTimezone: props.scheduleTimeZone,
      scheduleExpression: props.stopInstanceSchedule,
      target: {
        arn: 'arn:aws:scheduler:::aws-sdk:ec2:stopInstances',
        roleArn: schedulerRole.roleArn,
        input: JSON.stringify({ InstanceIds: [props.ec2Instance.instanceId]}),
      },
    });
  }
}