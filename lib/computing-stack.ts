import { IVpc, Instance, InstanceClass, InstanceSize, InstanceType, MachineImage, Peer, Port, SecurityGroup, UserData } from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { readFileSync } from "fs";

interface ComputingProps{
  region: string,
  accountId: string,
  vpc: IVpc,
  ami: string,
}

export class ComputingStack extends Construct{
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: ComputingProps) {
    super(scope, id);

    // セキュリティグループ
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
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
        `arn:aws:ssm:${props.region}:${props.accountId}:parameter/*`,
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
    const ami = props.ami;
    const instance = new Instance(this, 'Instance', {
      vpc: props.vpc,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO,),
      machineImage: MachineImage.genericLinux({
        'us-east-1': ami,
      }),
      role: ec2Role,
      ssmSessionPermissions: true,
      securityGroup: securityGroup,
      userData: userData,
    });

    this.instance = instance;
  }
}