# sns-to-sqs-local

A developer tool that starts a local web server, creates a public tunnel
connection to it via [ngrok](https://ngrok.com/), and subscribes a SNS topic to
the public address auto generated by **ngrok**. SNS messages sent to the web
server are forwarded to a local or remote SQS queue.

It is meant to be used during development to provide a stream of sample data
while developing and debugging a queue consuming service. This allows the
service to be debugged in as-close-production type of environment.

## Quick Test

- download or clone project
- make a copy of `local-template.env` as `local.env`.
- update `local.env` with desired variables.
- execute: `docker-compose up subscriber consumer`
- send Message to the sns topic

## How to Consume for Existing Projects

On its own, this project is worthless. Its logic and config is meants to be
consumed by other projects that forwards sns notifications to queue to be
consumed by a queue consumer. So here is high-level overview on how to import
to a existing project.

- download or clone project
- copy `subscriber` directory to existing project
- add `subscriber` service to existing `docker-compose`
  - update any `docker-compose` that may need to be changed
- import `env` variables to projects (see `local-template.env`)
- update any variables or settings that are required
