# SurveyJS Custom Component Sample

This project demonstrates how to create and use a custom component with SurveyJS.

## Running the Sample Page

1. Clone this repository.
2. Open the `index.html` file in your web browser.

## Using the Custom Component

The custom component is defined in `js/custom-component.js`. It's a simple component that displays a message.

To use it in a survey, add an element with `type: "custommessage"` to your survey JSON:

```json
{
  "elements": [{
    "type": "custommessage"
  }]
}
```