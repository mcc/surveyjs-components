function initNameCombine(Survey) {
  Survey.ComponentCollection.Instance.add({
    name: "nameCombine",
    title: "Name",
    questionTitleTemplate: "{title}",
    elementsJSON: [
      {
        type: "text",
        name: "surname",
        title: "Surname",
        isRequired: true,
      },
      {
        type: "text",
        name: "givenname",
        title: "Given Name",
        isRequired: true,
        startWithNewLine: false,
      },
      {
        type: "text",
        name: "fullname",
        title: "Full Name",
        readOnly: true,
        startWithNewLine: false,
      },
    ],
    onLoaded(question) {
      const surnameQuestion = question.contentPanel.getQuestionByName("surname");
      const givennameQuestion = question.contentPanel.getQuestionByName("givenname");
      const fullnameQuestion = question.contentPanel.getQuestionByName("fullname");

      const updateFullName = () => {
        const surname = surnameQuestion.value || "";
        const givenname = givennameQuestion.value || "";
        const fullname = (givenname + " " + surname).trim();
        fullnameQuestion.value = fullname;
        // Set the composite question's value
        question.value = {
            surname: surname,
            givenname: givenname,
            fullname: fullname
        };
      };

      surnameQuestion.registerFunctionOnPropertyValueChanged("value", updateFullName);
      givennameQuestion.registerFunctionOnPropertyValueChanged("value", updateFullName);

      // Initial update
      updateFullName();
    }
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = initNameCombine;
} else if (typeof Survey !== "undefined") {
  initNameCombine(Survey);
}
