# Versions and Aliases in AWS

Versioning is important part in any programming. Usually we start with bare minimum code, work on requirements gradually and publish our **version** when we have something solid to publish. Also there are different stages of our program, we iterate faster and in smaller chunks and release a *programmer ready* version in **alpha, canary, nightly or development** channels, we **iterate** on that and release a version for wider audience in **beta** and once we complete whole functionality and iron out bugs, we release our software into **production**. We can achieve similar functionality in AWS Lambda using **Versions** and **Aliases**.

Using function we [have developed](https://github.com/PrashamTrivedi/AWSDemo/releases/tag/CreateRunLogTrace), we will iterate on it and create versions for our  lambda. In this excersize we will create versions of our lambda function that does following version by version.

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
            body:JSON.stringify({name: 'AWS',
            message:'Provide a number to check whether it\'s even or odd'})}
    }
}
```

At this point our API endpoint has only one stage which is production, and the lambda connected to it points to only one version `$LATEST`. We need to create another stage called `Develeopment` and should point `$LATEST` to `Development`. And `Production` should point to previous version as mentioned earlier in this chapter.

## Changing API endpoints to point to versions

At this point your APIs are referencing to `$LATEST` version of lambda. There are more stable versions of same lambda but your APIs are not aware about it and thus not executing that version.

As per requirement above, [create two stages in API gateway](https://github.com/PrashamTrivedi/AWSDemo/blob/master/AWSFromCommandLine.md#connecting-lambda-function-to-api-gateway). Name them as `Dev` and `Prod`. Note that both stages use same resource and thus use same version of Lambda. As per UI, there isn't any provision to override any configuration per resource. However this limitation can be overridden by using Staging Variables, each Stage can have  set of variables which is available to all resources in that stage. Those variables are isolated, that means same variables have to be created separately for each state.

Here you can create a variable that reflect function name or `ARN` representing to different versions of Lambda. If your function name is `OddEven`, you can refer this to API gateway and this will always refer to `OddEvent:$LATEST` version. If you need to refer to version 2 of `OddEven`, you have to write `OddEven:2`. You can use that syntax in Staging Variables, and in turn use those staging variables to refer as lambda names.

To create staging variables

1. Select `Dev` stage in API Gateway.
2. Go to Stage Variables tab
3. Click to `Add Stage Variables`.
4. Enter Name as `functionName` and enter your function name in value. This will be a pointer to `$LATEST` version
5. Click Save (or Tick mark button).
6. Now select `Prod` stage.
7. Repeat stage 2 & 3.
8. Keep name as `functionName`, for value enter your function name and append `:{LastVersion}` after that. Your last version will be the version published before `$LATEST`. If you have 2 versions, version 2 and `$LATEST` are same version, you need to refer version 1 here.

Now we need to refer these values to `GET` resource. To do that,

1. Go to `Resources`.
2. Select `GET` resource.
3. Locate `Integration Request`, and Click on it. This is where you can edit name of your Lambda function.
4. Locate label **Lambda Function**, and edit it.
5. Instead of specific name of your lambda function, enter `${stageVariables.functionName}` as a value.
6. Press `Save` or Tick mark.
7. You will be shown a permission dialog, **Don't press `OK` blindly**. In this permission dialog, you can see **a command with a placeholder value**. You need to **Replace the placeholder value with actual value and run this command in CLI**.

    - If you have **blindly pressed `OK`** or **never run above mentioned command**, your **APIs will throw 500 error and there won't be any logs in CloudWatch**.

8. Load both stages' `GET` Apis and you can see different responses based on how your lambda is coded.
9. In cloudwatch logs, you can observe the source of your lambda in `event.requestContext.path` JSON structure. Which will reveal the stage from which the lambda is invoked.

This is not the ideal process. Before you can test the updated version you need to a) update the versions to their respected stages in console b) Give proper permission to each stage if required using CLI. And this process **repeats each time you update version**. Also whenever you need to update your event sources(e.g. API) you need to update every event source. That's long, repeated and thus error prone. To solve this problem, AWS has a facility called **Alias** which can be used as *named versions* to our lambda.

## Aliases

For AWS Lambda, we can create Aliases like `Dev` and `Prod` which can be hooked to `Dev` and `Prod` stages of the API. To create the alias, we can use Lambda console or AWS CLI.

### Creating Alias using Lambda Console

1. Locate a dropdown called `Actions`.
2. Click on `Create alias`.
3. In a dialog box, enter name, description of new version.
4. Also specify version name to attach to alias. An alias can point to one or two versions. **An alias can only point to a version, either `$LATEST` or numbered version.
5. Click `Create`.

### Creating Alias using CLI

To create Alias using Command line, run following function.

`aws lambda create-alias --function-name ${FunctionName} --name ${AliasName} --function-version ${VersionNumber}`

The difference between creating alias in Console vs creating alias using CLI is that you can not pass `$LATEST` as version using CLI.

Second useful step of using alias is to assign a version to an Alias. To do that the easiest way is to run a command.

`aws lambda update-alias --function-name ${FunctionName} --name ${AliasName} --function-version ${VersionNumber}`.

Once the alias is created, you don't need to change much to point API to the alias. Instead of specific version you need to provide name of our Alias. E.g. you need to replace `OddEven:Prod` instead of `OddEven:2`. You still need to give permission to new alias. But this is a one time process per Alias. And will work for every update afterwards.

In API console, change `functionName` variable in `Prod` stage to `OddEven:Prod`, and in `Dev` stage, change it to `OddEven:Dev`.

In this process once you are done developing new version, all you need to run two commands. First command is to assign latest version to `Dev` and the previous version to `Prod`, and once you do this you are all set to run two different versions of Lambda in two different stages.