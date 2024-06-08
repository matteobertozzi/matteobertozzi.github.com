---
{
  "title": "Deno AWS Lambda ARM/Graviton2 Build",
  "timestamp": 1650659671000,
  "tags": ["aws", "aws-lambda", "deno"]
}
---

I'm using AWS Lambda to run some [Deno](https://deno.land/) code.
Since there is no official support for Deno on AWS,
and the underlying arm64 machine running Amazon Linux 2 is still using Glibc 2.26...

A "custom" build of Deno for the AWS Lambda ARM/Graviton2 machines is necessary.
You can find the binaries here https://github.com/matteobertozzi/deno-aws-lambda-arm/releases.

### Building Deno for Graviton2
There is nothing special in the build of Deno for the ARM/Graviton2 machines. \
You can just spin up an EC2 machine "Amazon Linux 2 AMI" (e.g. t4g.medium), \
Install Rust and build deno using cargo install.
```bash
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
$ cargo install deno --locked
```

### AWS Lambda Custom Runtime
Making a "small" custom runtime (< 250MB) is easy. You just need a "bootstrap" and a "runtime" file.

The boostrap file should setup the environment and start deno with the runtime.ts file.
```bash
#!/bin/sh
# bootstrap
set -euo pipefail

export DENO_DIR=/tmp/.deno-dir
./deno-amazon-linux2-arm64 run --allow-env --allow-net --allow-read=deno-local-data runtime.ts
```

The runtime.ts file contains the lambda loop that: fetches the task, executes it and sent back the response.
```typescript
const AWS_LAMBDA_RUNTIME_API = Deno.env.get("AWS_LAMBDA_RUNTIME_API");
const AWS_LAMBDA_URI = 'http://' + AWS_LAMBDA_RUNTIME_API + '/2018-06-01/runtime/invocation';
const HANDLER = Deno.env.get("_HANDLER");

while (true) {
  const next = await fetch(AWS_LAMBDA_URI + '/next');
  const headers = next.headers;
  const requestId = headers.get('lambda-runtime-aws-request-id');

  let res;
  try {
    const event = await next.json();

    // TODO: this is the execution logic.
    const body = {'executed': requestId, 'handler': HANDLER, 'event': event};

    console.log('send response', body);
    res = await fetch(AWS_LAMBDA_URI + '/' + requestId + '/response', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  } catch(e) {
    console.log('send error', e);
    res = await fetch(AWS_LAMBDA_URI + '/' + requestId + '/error', {
      method: 'POST',
      body: JSON.stringify({
        errorMessage: e.message,
        errorType: 'EXCEPTION'
      })
    });
  }
  const x = await res.blob();
  console.log('result upload', x);
}
```
