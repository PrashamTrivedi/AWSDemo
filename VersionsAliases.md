# Versions and Aliases in AWS

Versioning is important part in any programming. Usually we start with bare minimum code, work on requirements gradually and publish our **version** when we have something solid to publish. Also there are different stages of our program, we iterate faster and in smaller chunks and release a *programmer ready* version in **alpha, canary, nightly or development** channels, we **iterate** on that and release a version for wider audience in **beta** and once we complete whole functionality and iron out bugs, we release our software into **production**. We can achieve similar functionality in AWS Lambda using **Versions** and **Aliases**.

Using function we [have developed](https://github.com/PrashamTrivedi/AWSDemo/releases/tag/CreateRunLogTrace), we will iterate on it and create versions for our `OddEven` lambda. In this excersize we will create versions of our lambda function that does following version by version.

1. In next version we will response back whether a number is provided or not.
2. After that we will report whether the number is even or odd.
3. After that we will catch all errors and report it to CloudWatch.
4. Send email each time an exception is reported to CloudWatch.

Each iteration will have it's own version. Apart from that we will create two environments via **Aliases**, named **Development** & **Production**. Every time a function is uploaded we will use **Development** alias for it's latest version and **Production** for previous version. We will also reflect our APIs as per the environment.

Let's see them in example.

## Version

Every AWS Lambda function has versions whether we publish it or not. Every Lambda function has a default version called `$LATEST` which will be default version and will point to latest version unless we will publish new version. There are three ways to publish a new version.

### 1. Publish a new version from Console

To publish a new version, go to [AWS Lambda Console](https://ap-south-1.console.aws.amazon.com/lambda/home) and select your function.

1. Locate a dropdown called `Actions`.
2. Click on `Publish a new Version`.
3. In a dialog box, enter description of new version.
4. Click `Publish`.

This will create a new version. Creating a version is a **non reversible change**. You can see created version by clicking `Qualifiers` button, where you can see `Versions` and `Aliases` tabs. By clicking on `Versions` you can see your version. You can also confirm that `$LATEST` and your latest version are published on same date. By clicking on any version you can see historical configuration of this version. You can also notice that `ARN` of the function changes when we update a new version (and new alias).

This is one way of publishing version which requires console. The other two can be done using command line.

### 2. Publishing version using command line

By running below command, you can create version using AWS CLI.

`aws lambda publish-version --function-name {FunctionName}`

This will create a new version, which you can confirm on console. However this command doesn't change any code. There is a separate command for updating the function code.

### 3. Publishing version while updating the code

For updating the function AWS Cli has another command called `update-function-code`. Just like create function command we have seen in [previous chapter](./AWSFromCommandLine.md), we need to create a zip of updated function, and give it to `update-function-code` command. This command has an option called `--publish`. When we add this option, we essentially create new version to that code, without that the command will update code to `$LATEST` version.

Full command to update code to new version is:

`aws lambda update-function-code --publish --function-name ${FunctionName} --zip-file fileb://{PathToZip}`

To update code to `$LATEST`, the command will be

`aws lambda update-function-code --function-name ${FunctionName} --zip-file fileb://{PathToZip}`

By the way, the code for first step, for which we will create a new version is as below.

```javascript
var AWSXray = require('aws-xray-sdk');

exports.handler = async function (event, context) {
    console.log('Hi');
    console.log(`Event is ${JSON.stringify(event)}`);
    console.log(`Context is ${JSON.stringify(context)}`);
    if (event.queryStringParameters) {
        AWSXray.captureFunc('Query', function (subsegment) {
            console.log(`Query is ${JSON.stringify(event.queryStringParameters)}`);
            subsegment.addAnnotation('Query', event.queryStringParameters.number);
            subsegment.addMetadata('Qry', event.queryStringParameters, 'Custom');
            subsegment.addMetadata('Qry', event.queryStringParameters);
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ name: 'AWS',number: event.queryStringParameters.number}) };
    } else {
        return {
            statusCode:200,
            body:JSON.stringify({name: 'AWS', message:'Provide a number to check whether it\'s even or odd'})}
    }
}
```
