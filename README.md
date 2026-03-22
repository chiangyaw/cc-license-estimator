# Cortex Cloud License Estimator

An unofficial static web app that helps Palo Alto Networks team members and partners estimate the number of licenses required for Cortex Cloud consumption. It does not provide pricing — use the output to work with your Palo Alto Networks sales representative on a commercial quote.

## Features

Select one or more of the three Cortex Cloud capabilities to estimate:

- **Posture Security** — covers cloud buckets, managed databases, DBaaS, SaaS users, container images (beyond free quota), and unmanaged assets
- **Runtime Security** — covers VMs (with and without containers), CaaS managed containers, and serverless functions
- **Application Security** — add-on requiring Posture or Runtime; billed per developer (minimum 5)

## How it works

Enter your workload quantities, tick the relevant features, and click **Calculate License**. The app converts each workload type into billable units using fixed ratios (e.g. 10 CaaS containers = 1 workload, 25 serverless functions = 1 workload) and applies a minimum order quantity (MOQ) of 200 where applicable.

Container images include a free quota of 10x your total deployed workloads — only images beyond that threshold are billed.

## Reference

For official metering details, refer to the [Cortex Cloud Metering Guide](https://www.paloaltonetworks.com/apps/pan/public/downloadResource?pagePath=/content/pan/en_US/resources/datasheets/metering-licensing-cortex-cloud).

For automated sizing, see the [Cortex Cloud Sizing Scripts](https://github.com/chiangyaw/cc-sizing-scripts).
