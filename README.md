# LLM mindmap generation with Malli

OpenAI JSON schema response format based mindmap generation using Malli. Also, wanted to try out babashka and squint. Heavy lifting done by all the awesome stuff such as Malli, babashka, OpenAI, react-d3-tree etc.

Also, shoutout to [aider](https://github.com/paul-gauthier/aider) which was helpful on translating the initial JS React proto to squint and various other things.

## Features

- Generate mindmap by writing a topic in the input box and clicking on the "Generate" button (or press Enter)
- Double click on a node to further explore the topic (API for prompt generation based on the mindmap node path)

## Prerequisites

- [babashka](https://github.com/babashka/babashka)
- [squint](https://github.com/squint-cljs/squint)
- [npm](https://www.npmjs.com/)

## Quick Start

```
$ pnpm i  # or npm i
$ export OPENAI_API_KEY=<your-openai-api-key>
$ bb dev
# open http://localhost:5173
```
