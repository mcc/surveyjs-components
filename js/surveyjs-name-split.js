Survey.ComponentCollection.Instance.add({
  name: "fullnameSplit",
  title: "Full Name Splitter",
  isComposite: true,
  properties: [
    { name: "fullname", type: "text" },
    { name: "givenname", type: "text", readOnly: true },
    { name: "surname", type: "text", readOnly: true }
  ],
  onValueChanged: function(newValue) {
    if (!newValue) return;

    // Split fullname by space
    const parts = newValue.fullname ? newValue.fullname.trim().split(/\s+/) : [];

    const givenname = parts.length > 0 ? parts[0] : "";
    const surname = parts.length > 1 ? parts[parts.length - 1] : "";

    this.value = {
      fullname: newValue.fullname,
      givenname: givenname,
      surname: surname
    };

    this.survey.setValue("givenname", givenname);
    this.survey.setValue("surname", surname);
  },
  getDisplayValue: function(value) {
    if (!value) return "";
    return `${value.fullname} (Given Name: ${value.givenname}, Surname: ${value.surname})`;
  },
  onAfterRender: function(question, el) {
    const self = this;
    // Create fullname input with SurveyJS textbox style
    const inputFullname = document.createElement("input");
    inputFullname.type = "text";
    inputFullname.placeholder = "Full Name";
    inputFullname.className = "sd-input"; // Apply SurveyJS textbox style
    
    // Create givenname input (readonly) with SurveyJS textbox style
    const inputGivenname = document.createElement("input");
    inputGivenname.type = "text";
    inputGivenname.placeholder = "Given Name";
    inputGivenname.readOnly = true;
    inputGivenname.className = "sd-input";
    
    // Create surname input (readonly) with SurveyJS textbox style
    const inputSurname = document.createElement("input");
    inputSurname.type = "text";
    inputSurname.placeholder = "Surname";
    inputSurname.readOnly = true;
    inputSurname.className = "sd-input";

    el.appendChild(inputFullname);
    el.appendChild(inputGivenname);
    el.appendChild(inputSurname);

    // Load existing value
    if (question.value) {
      inputFullname.value = question.value.fullname || "";
      inputGivenname.value = question.value.givenname || "";
      inputSurname.value = question.value.surname || "";
    }

    // When fullname changes
    inputFullname.addEventListener("input", () => {
      const fullname = inputFullname.value;
      const parts = fullname.trim().split(/\s+/);
      const givenname = parts.length > 0 ? parts[0] : "";
      const surname = parts.length > 1 ? parts[parts.length - 1] : "";

      inputGivenname.value = givenname;
      inputSurname.value = surname;

      question.value = {
        fullname,
        givenname,
        surname,
      };
      question.notifyValueChanged();
    });
  }
});
