# Security policy

## Reporting a vulnerability

Please do not report security problems in public issues. Instead, use GitHub's private reporting: go to the repository's **Security** tab and choose **Report a vulnerability**.

Include what you found, how to reproduce it, and the impact you expect. We aim to acknowledge reports within a few days and will keep you updated until a fix ships.

## Scope

anythic/ui renders model output, which should always be treated as untrusted. Issues we especially want to hear about:

- Markdown or other model output that leads to script execution (XSS), for example through links, images or code blocks
- Ways to make a component perform an action the user did not approve, such as bypassing `ToolApproval`
- Secrets, such as API keys, leaking from the docs app's server code to the browser

## Supported versions

The project is pre-1.0; fixes land on the latest version only.
