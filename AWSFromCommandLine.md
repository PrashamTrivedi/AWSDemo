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

## Hooking lambda function to API gateway.

[Amazon API Gateway](https://ap-south-1.console.aws.amazon.com/apigateway/home) is a good and easy way to create and publish REST Apis which can be hooked to any AWS services. For this example we will create 