# Project Discussions

**Date:** 2025-01-19

## Summary
- Finalize scope, actors, and primary use cases for the project.
- Produce a rough UML/UCL diagram and distribute work among team members.

## Scope & Actors

- **Primary Actor:** Developer / Student — asks questions, uploads files, runs code.
- **Secondary/System Actors:** LLM API (OpenAI/Gemini), Auth service, Database, External backend agent, Execution engine.

## UML / Diagrams

Rough diagrams created during the discussion:

- ![UML diagram](image.png)
- ![UCL diagram](i2.png)A

## Work Distribution

| Team Member | Task |
|------------:|------|
| Abhas      | Identify use cases |
| Aniruddha  | Identify actors |
| Abhinav    | Prepare diagrams |

## Actors

- User (Developer / Student)
- Admin (System Management)
- Auth Service
- Database
- External Backend Agent

## Use Cases

### User (Developer / Student)

#### Account & Profile
- Login
- Register
- Manage profile
- Logout

#### Coding & AI Assistance
- Ask coding question
- Refine question
- Provide context
- Generate code
- Explain code
- Debug errors

#### Code Execution
- Run / compile code
- Create files

#### Task Automation
- Automate tasks
- Schedule tasks
- Define task triggers
- View active tasks

#### File & Repository Handling
- Upload files
- Analyze repository
- Import from GitHub
- Index local files

#### History & Data
- View chat history

### Admin (System Management)
- Login / Logout
- Manage users
- View system logs
- Configure agent settings

### Backend / System

#### Authentication
- Authenticate user

#### Data Handling
- Store data
- Retrieve data

#### Execution Engine
- Execute commands
- Capture output
- Execute backend tasks

### External Systems

#### Auth Service
- Authenticate user

#### Database
- Store data
- Retrieve data

#### External Backend Agent
- Execute backend tasks

## Relationships

### Include (mandatory)
*If action A occurs, action B must also occur.*

- Login «include» Authenticate User
- Register «include» Authenticate User
- Run / Compile Code «include» Execute Command
- Run / Compile Code «include» Capture Output
- Schedule Task «include» Define Task Trigger

### Extend (optional)
*Optional behaviors that may augment main use cases.*

- Refine Question «extend» Ask Coding Question
- Provide Context «extend» Ask Coding Question
- Debug Errors «extend» Explain Code (debugging follows explanation when errors are found)
- Import from GitHub «extend» Analyze Repository
- Index Local Files «extend» Analyze Repository

## Notes

- The diagrams are draft versions; diagrams should be refined into a proper UML/UCL using a modeling tool.
- Confirm any missing actors or system integrations before finalizing the use-case model.


now i am making a separate final file for assignment 2

