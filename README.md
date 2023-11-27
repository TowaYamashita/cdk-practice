# cdk-practice

## OverView

Amazon EC2 + Amazon EventBridge Scheduler を利用した定期的な処理の実行インフラ

## Environment

```shell
❯ aws --version
aws-cli/2.13.32 Python/3.11.6 Darwin/23.1.0 exe/x86_64 prompt/off

❯ node --version
v20.9.0
```

## Usage
1. AdministratorAccess のIAMポリシーをアタッチされたIAMユーザを作成し、そのユーザのアクセスキーIDとシークレットアクセスキーを取得する

2. aws configure で 取得したアクセスキーIDとシークレットアクセスキーを設定する

3. 下記コマンドを実行して、アプリケーションスタックをデプロイする

```shell
npm install
npm run cdk bootstrap
npm run cdk deploy
```

4. 下記コマンドを実行して、アプリケーションスタックを削除する
```
npm run cdk destroy
```

> npm run cdk bootstrap 実行時に作成されたブートストラップスタックは AWS CloudFormation コンソールから手動で削除する