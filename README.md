<table>
<tr>
<td><img src="./compass-logo.svg" width="100" alt="Compass Logo"></td>
<td><h1>Ursa Compass</h1></td>
</tr>
</table>

Ursa Compass is a tool to help data engineers make sense of healthcare claims data packages. It sets up a three-way conversation between the data engineer, the LLM, and the procedural code of Ursa Compass.

Ursa Compass drives the conversation based on a series of questions in an editable yml playbook. It poses the questions to the LLM, which has the option of running a SQL query, asking the data engineer for clarification, or attempting to answer the question with an assertion that can be accepted or rejected from the data engineer.

```mermaid
graph TD;
    style User fill:#71bf00,stroke:#333,stroke-width:2px;
    style Ursa_Compass fill:#71bf00,stroke:#333,stroke-width:2px;
    style Database fill:#999,stroke:#333,stroke-width:2px;
    style LLM fill:#71bf00,stroke:#333,stroke-width:2px;
    User([Data Engineer]) --> |Reviews Work<br>Answers Clarifications<br>Accepts/Rejects Assertions| Ursa_Compass([Ursa Compass]);
    Ursa_Compass --> |Forwards Clarifications<br>Forwards Assertions| User;
    Ursa_Compass --> |Executes SQL| Database[(Database)];
    Ursa_Compass --> |Structures Conversation<br>Forwards SQL Results | LLM([LLM]);
    Database --> |Returns SQL Results| Ursa_Compass;
    LLM --> |Writes SQL<br>Asks Clarifications<br>Makes Assertions | Ursa_Compass;
```

## How to use

There are three ways to use Ursa Compass.

#### Run Ursa Compass locally

The git repo of Ursa Compass ships with a sample implementation in Next.js, which can be run locally on your workstation, as follows:

```
 $ (cd engine && npm install)
 $ (cd ui && npm install && npm run build)
 $ cd nextjs-app
 $ npm install
 $ npm run dev
```

You will want to set DATABASE_TYPE and TARGET_DATABASE_URL in `/nextjs-app/.env.local`. You can edit the prompts in the `prompts` directory to fit your workflow.

#### Integrate Ursa Compass into your application

Ursa Compass comprises two npm packages: `ursa-compass`, which is just the engine, and `ursa-compass-ui`, which is the React front-end.

```
 $ npm install ursa-compass ursa-compass-ui
```

You can look at the nextjs-app directory as a reference implementation for how to build your app around Ursa Compass. In short, you will include InspectionWorkspace as a React component, and implement all the request handlers, presumably updating them to use a database instead of saving files to your local filesystem. The route that processes the socket request will rely on `ursa-compass` to do the heavy lifting.

#### Use Ursa Studio

If you're looking to use Ursa Compass in the context of a battle-tested enterprise SaaS platform which covers the full breadth of healthcare data needs, contact sales@ursahealth.com and ask about Ursa Studio, which has Ursa Compass as one of its features.

## HIPAA concerns

Yes, PHI is absolutely going to be flowing through this system. What makes Ursa Compass HIPAA-compliant is that it uses AWS Bedrock and leverages your existing AWS account. You'll need to have an AWS account, with the BAA paperwork and all the other compliance steps in place.