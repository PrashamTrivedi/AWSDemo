# Using AWS CLI to develop lambda functions locally

AWS Lambda is a way to create and operate serverless functions. Their default way of writing function is to use their inline IDE, where we are to write our function code and execute it. This way differs a lot from competition, mainly Firebase Cloud Function and Heroku, where we can locally write cloud function and deploy them to the cloud.

Firebase & Heroku defaults to their CLI(Command line interface) and allow us to work locally and deploy when we’re done. AWS also has a CLI which give us option to manage lambda functions along with other service. In this guide, we will see how to install AWS CLI and work with functions using it.

## Installing AWS CLI

Assumption: You are using Mac/Linux. If you’re using Windows or need better understanding follow AWS CLI installation Guide, follow [AWS CLI installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

1. Check if Python is installed.
    - Open command line and run `python --version`. If you have python installed, you will get `Python {VersionNumber}` as Output. Make sure VersionNumber is 2.6+ or 3.3+
    - If Python is not installed, [Download python](https://www.python.org/downloads/) and come back to this step

2. Download AWS CLI.
    - Run `curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"`
    - This command will download `awscli-bundle.zip` to your location.

3. Unzip AWS CLI.
    - Run `unzip awscli-bundle.zip`

4. Install AWS CLI
    - Run `sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws`
    - You will be prompted to enter password.

5. Confirm the installation
    - By Running `aws --version` command. If everything is successfully installed you will see some output.

6. Add AWS Installation in your PATH variable.
    - Mostly we all have Bash shell installed by default. Someone may have configured a different shell.
    - Check your shell by running `echo $SHELL` in your command line. If you have bash your output will be `bin/bash`. In case of ZSH it will be `bin/zsh`
    - Based on your shell, there will be a profile script
        - In Case of Bash: .bash_profile, .profile, or .bash_login.
        - For ZSH: .zshrc
    - Open that your profile script. (E.g. for mac `run open ~/.bash_profile` or `open~/.zshrc`)
    - Add `export PATH=~/.local/bin:$PATH` in your script if you have not defined your path yet
    - If you already have path, add `~/.local/bin` in your existing path.
    - Reload Shell config by running `soucre ~/.bash_profile` or `source ~/.zshrc` (Replace your own profile script file as an input of source command).

7. Configure your AWS installation.
    - The fundamental of AWS Lambda is every function is scoped with security point of view. You can’t just run your function as AWS admin user. AWS recommends us to use Identity and Access Management for that.
    - If you are developer, Ask your AWS administrator to get IAM Access key ID and Secret Key.
    - If you are AWS administrator, follow this guide to create IAM user and get Access Keys
    - Once you get AWS Keys run aws config command.
    - This will ask you following
        - AWS Access Key ID: Pass your Access key ID
        - AWS Secret Access Key: Pass your Secret Key
        - Default Region Name: Pass your default region where your lambdas should run. Once logged in, you can get Region name from AWS homepage url. Example url can be `https://{region}.console.aws.amazon.com/console/home?region={region}`
        - Default Output format: Use json for output to be json. Other options are text Which is useful to process output to text processing tools like grep. And table which is useful for human interpretation.

8. Confirm successful configuration by running aws lambda list-function
    - On successful configuration this command will output list of functions, or empty in case we don’t have any functions.
    - In case configuration can’t identify a proper user this command will output something like this
    `An error occurred (UnrecognizedClientException) when calling the ListFunctions operation: The security token included in the request is invalid.`

At this point we have installed, configured and confirmed AWS Cli installation. Now we’re ready to write our first AWS lambda function and deploy.

## Writing lambda functions locally and deploy them

Writing lambda functions locally using your favorite IDE is same is writing a normal Node JS applications. Only change is some different configuration. For this example & guide I have used Visual Studio Code, but running this is not bound to any specific IDE.

For example we will write a simple function, which prints something, read event and context objects, use them in Response and return that response.

We will follow traditional JS project structure where all our code will be stored in `src` directory.

The sample code is as follows. In my sample this code is in `src/first.js` file.

```javascript
exports.handler = async function (event, context) {
    console.log('Hi');
    let response = JSON.stringify(event, context, 0);
    console.log(response);
    return response;
}
```

This is a function that will run as our lambda. At this point we don't have any lambda function crated. We need to create lambda function using aws command line.

AWS lambda requires a zip blob to be uploaded by AWS CLI. To create a code from zip, we need to run following command.

`zip -r test.zip  src/*`

This code doesn't require any Node dependency. In case your code requires one, you should include `node_modules/*` directory in zip. Remember, CLI can upload maximum of 50mb zip file, and node_modules can grow beyond that size if we become careless in chosing our dependencies.

Now that we have our zip, we can call `aws lambda create-function` command from command line using some parameters.

The command looks like below.

`aws lambda create-function --function-name ${FunctionName} --runtime nodejs8.10 --role ${RoleString} --handler src/first.handler --timeout 300 --zip-file fileb://test.zip`

Below, I am using some useful parameters, to get list of all params read official guideline [here](https://docs.aws.amazon.com/cli/latest/reference/lambda/create-function.html).

- `function-name`: Name of your function.

- `runtime`: Runtime of your function, AWS Lambda supports python, Java, Go, Node, C# & Powershell scripts, in this example we will use `nodejs8.10`.

- `role`: Role ID of your aws IAM user. You need to get **ARN**(Amazon Resource Name) string from [here](https://console.aws.amazon.com/iam/home#/roles).

- `handler`: Handler is entry point of your function. Convention is to export a function named `handler` from your javascript file and pass `fileName.handler` value here. If you use a function other than default `handler`, you need to export that function and pass `fileName.exportedFunction` as value here.

- `timeout`: Timeout in seconds for this lambda. Your lambda will timeout if it executes longer than value speficied here. Default value here is **3 Seconds** which is criminally low.

- `memory-size`: Memory required to run this function. Minimum and default value is `128 mb` which is good enough. If you need more memory, change the value which **is multiple of 64mb**.

- `zip-file`: The zip file that we created in previous step. The value must be `fileb://{zipFilePath}` to indicate zip as uploadable blob.

After running this command, confirm our function is created successfully on console.

Now we will hook this lambda to an API and try to run it.

## Connecting lambda function to API gateway

[Amazon API Gateway](https://ap-south-1.console.aws.amazon.com/apigateway/home) is a good and easy way to create and publish REST Apis which can be hooked to any AWS services. For this example we will create a simple GET API and Hook it with our lambda function. To do this follow the steps below.

1. Sign in to [Amazon API Gateway](https://ap-south-1.console.aws.amazon.com/apigateway/home).

2. If you don't have an API created, create an API.

    - Chose `New API`.
    - Give it a name.
    - Choose Create API.

3. Now create a child resource. Each resource will be path of your API and we can define methods under a resource. For our example we will create a resource called `playground`.

4. Once a resource is created we will create a method in that resource. A method will correspond to HTTP Verbs, so a `GET` method under `playground` resource will create a `GET` api in path `playground`. To create a resource, follow these steps.

    - Click `Actions` button and from options select `Create Method`.
    - You will be presented a dropdown, select `GET` there.
    - Click on Tick mark and you will be presented options in Right side pane.
    - In `Integration Type`: Select `Lambda Function`.
    - Check `Use Lambda Proxy Integration`.
    - Select your Lambda region and write a function name in `Lambda Function` input.
    - Click save, you will be prompted to a permission, click `OK`.

5. Once you setup, go to `Actions` button and select `Deploy API`.

    - You will be prompted to select Stage, create a stage or select already created stage.
    - Click `Deploy`.
    - Once it's already deployed, Go to `Stages`.
    - Locate your stage, under your stage you can see list of resources and methods under resources. Locate `playground` resource and select `GET` under `playground`.
    - In right pane you can see `Invoke URL`. We have used `GET` method so that we can test our code right from browser.
    - Copy invoke URL and paste it in different tab.

*In case the steps are not helping you or outdated. You should follow [this guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html#api-gateway-proxy-integration-lambda-function-nodejs) to map your API with Lambda function.*

At this point, you can't see a proper response. There will be an error, opening the invoke URL will show an error message like below.

```json
{"message": "Internal server error"}
```

We need to debug what is giving us this error. In normal node projects, we use `console.log` to print some logging information, but this is not a normal node project. Our code, at this point, is running in AWS environment and we need some logging mechanism and a service to see the logs we have generated.

## Using AWS CloudWatch for Logging

Remember we have `console.log` statements in our code. Two of which are printing JSON representation `event` and `context` objects. We also print a response object. And by default all these statements are logged to AWS CloudWatch.

Apart from `console.log` amazon cloudwatch also support `console.error`, `console.warn` & `console.info` methods. To see logs per lambda follow steps mentioned below.

- Go to AWS Lambda console and select your lambda.
- Select `Monitoring` tab.
- You will see `View Logs in CloudWatch` button, click that.
- You will be presented a list of streams associated with that lambda. The number of streams usually relate to number of integrations that lambda function has.
- Open a stream by clicking on it.
- You will see the logs arranged by time. You will see the logs.
- If you have followed the example, you can see four log items ending with `Hi`, `event is (A Json Object)`, another `event is (A Json Object)` and an json starts with `resource`. Expand any of these message to see full message.

After seeing the logs for error we can confirm that there is nothing wrong with our lambda, but the API is expecting a proper response. Also, the second `event is` log is actually a log for `context` object, which we should reflect accordingly in console message. Let's make those changes.

```javascript
exports.handler = async function (event, context) {
    console.log('Hi');
    console.log(`Event is ${JSON.stringify(event)}`);
    console.log(`Context is ${JSON.stringify(context)}`);
    let response = JSON.stringify(event, null, 0);
    console.log(response);
    return { statusCode: 200, body: JSON.stringify({ name: 'AWS' }) };
}
```

Once we update the function reflecting above code, we can see our API is returning successfully and you can see `{name:AWS}` in your browser page. **Open same API in another tab and keep both tabs open**, we will require atleast two different requests later in next step.

Now it's time to monitor the performance of this function.

## Using AWS X-Ray for performance monitoring

Performance monitoring is an integral part of any system and we should consider it seriously when using cost sensitive systems like Firebase or AWS. And for Performance monitoring, AWS has a service called AWS X-Ray.

There are two ways to use X-Ray for performance monitoring, the first one is using **Lambda Console** and the other one is using **X-Ray SDK**.

### Using AWS Lambda Console for X-Ray

To monitor traces of your lambda function follow these steps.

1. Go to Lambda Console.
2. Select the function you want to monitor.
3. Select Configuration Tab.
4. Scroll Down and Find `Debugging and Error Handling` section.
5. Check `Enable Active Tracing.`

After following these steps, your lambda will be traced and the records will be shown in X-Ray console. Refresh the API so that our function will run and performance monitoring records will be stored in X-Ray Console. To see them, go to `Monitoring` Tab and click `View traces in X-Ray` button. It will lead you to X-Ray console and let you see performance monitoring.

### Using AWS X-Ray Node SDK

After integrating AWS Lambda and X-Ray using above steps. X-Ray traces all important traces for us, which is good enough for many use-cases. That eliminates the use of X-Ray SDK in Lambda environment. However we can use AWS SDK to capture subsegment, add Annotations and Metadata to that subsegment and those info will be shown in X-Ray Console.

To use AWS X-Ray SDK. Run `npm install --save aws-xray-sdk` command from your project location. This will add X-Ray SDK in your project. After that change your code as follows.

```javascript
var AWSXray = require('aws-xray-sdk'); //1

exports.handler = async function (event, context) {
    console.log('Hi');
    console.log(`Event is ${JSON.stringify(event)}`);
    console.log(`Context is ${JSON.stringify(context)}`);
    if (event.queryStringParameters) {
        //2
        AWSXray.captureFunc('Query', function (subsegment) {
            console.log(`Query is ${JSON.stringify(event.queryStringParameters)}`);
            subsegment.addAnnotation('Query', event.queryStringParameters.number); //3
            subsegment.addMetadata('Qry', event.queryStringParameters, 'Custom'); //4
            subsegment.addMetadata('Qry', event.queryStringParameters); //5
        });
    }
    let response = JSON.stringify(event, null, 0);
    console.log(response);
    return { statusCode: 200, body: JSON.stringify({ name: 'AWS' }) };
}
```

In above code, we have initialized AWS X-Ray object(1). This Object is used to instrument many AWS Services and HTTP calls. In lambda environment we are not using any of these, instead we are going to add trace segment and add some Annotations and MetaData.

Annotations are kind of an Index to our trace or subsegment, we can filter traces using annotation key and values and pass some metadata about our trace.

To add a subsegment, call `AWSXray.captureFunc` function(2) in your code. You have to pass a name of your subsegment and a callback. Write the code you want to trace in callback of the function. After the last line of `captureFunc` the subsegment will end. There is also a variant called `captureAsyncFunc`. The only difference between these functions is ending the trace. In `captrueFunc` trace will end automatically after last line of callback, while in `captureAsyncFunc` we have to call `subsegment.close()` to end the trace.

To add annotation, call `subsegment.addAnnotation()`(3) method. This method requires name of the annotation, and value which should be either `String`, `Boolean` or `Number`.

To add metadata, there are two variants. The one with default Namespace(5) and the other with custom Namespace(6). Both methods require `Key` and `Value` which should be either `String`, `Boolean`, `Number` or `Object`. The value of Custom namespace must be a string.

When you re-run your APIs and watch the trace, you can see your custom sub segment added after all default segments. In our case it will be `Query` subsegment. In default view, it will show you execution time of the subsegment. Upon clicking on that subsegment you can see multiple tabs, two of them are `Annotation` and `Metadata`. You can see annotations we have passed there and whole metadata arranged by namespace.

Now if you have two requests open, go to their address bar and append `?number=12` and `?number=24` respectively as query parameters. The value of them will be passed in `event.queryStringParameters` JSON. Run both the requests. There shouldn't be any changes in output. In above code, we have passed value of `number` parameter as annotation.

To serch by annotations, go back to traces view and in search bar add `AND annotation.Query="24"` at the end of the existing query. Refresh and see you can see that the traces shown there are filtered according to search query. Click on a trace, and see the details of `Query` subsegment, you can see the annotation has `Query` parameter and it's value is `24`, which confirms the filter is working.

This is it for developing lambda functions locally, adding logs and adding traces. In future we will go bit advanced in AWS Lambda.