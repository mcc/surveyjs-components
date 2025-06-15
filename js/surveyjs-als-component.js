// Helper function for API requests (similar to example's sendRequest)

// Register the custom question type with SurveyJS using ComponentCollection
Survey.ComponentCollection.Instance.add({
    name: "als-address",
    title: "Hong Kong Address Lookup", // Title for the toolbox/UI
    baseQuestion: "dropdown", // Specifies that our question type extends 'dropdown'
    questionJSON: { // Default JSON properties when this question is created
        type: "dropdown",
        name: "hk_address_als", 
        title: "Search for a Hong Kong Address (ALS - type min 3 chars)",
        isRequired: true,
        searchEnabled: true,
        choicesLazyLoadEnabled: true, 
        choicesMinChars: 3,
        hasNone: true,
        noneText: "Select an address or type to search..."
    }
});

async function fetchAlsData(url) {
    console.log(`Fetching from ALS: ${url}`);
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`ALS API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`ALS API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function getAddressDisplayText(addressItem) {
    if (!addressItem) return "N/A";
    if (addressItem.Address.PremisesAddress && addressItem.Address.PremisesAddress.EngPremisesAddress) {
        return addressItem.Address.PremisesAddress.EngPremisesAddress.BuildingName;
    } else if (addressItem.address) {
        const parts = [
            addressItem.address.engPremises,
            addressItem.address.engStreetName,
            addressItem.address.engRegion
        ];
        return parts.filter(part => part && part.trim() !== "").join(", ") || "Address details missing";
    } else if (typeof addressItem === 'string') { // Fallback if item is just a string
        return addressItem;
    }
    return "Address format not recognized";
}

function initAlsComponent(survey){
    survey.onChoicesLazyLoad.add(async (sender, options) => {
        // Check if this event is for our specific address question
        if (options.question.name === "hk_address_als") {
            console.log(options.question, sender);
            console.log(`onChoicesLazyLoad triggered for ${options.question.name}: searchText='${options.filter}', skip=${options.skip}, take=${options.take}`);
            
            if (!options.filter || options.filter.trim().length < options.question.choicesMinChars) {
                options.setItems([], 0); // Clear items if search text is too short
                return;
            }

            const query = options.filter; // options.filter contains the search text
            const encodedQuery = encodeURIComponent(query);
            // Using options.skip and options.take for pagination if the API supports it well for search
            // The ALS API uses 's' for skip and 't' for take.
            const skip = options.skip || 0;
            const take = options.take || 20; // Default to 20 items if not specified

            const apiUrl = `https://www.als.gov.hk/lookup?q=${encodedQuery}&s=${skip}&t=${take}`;
            
            try {
                const data = await fetchAlsData(apiUrl);
                console.log("ALS API Response Data (onChoicesLazyLoad):", data);

                if (data && Array.isArray(data.SuggestedAddress)) {
                    const addressChoices = data.SuggestedAddress.map(item => ({
                        value: item, // Store the entire result item object as the value
                        text: getAddressDisplayText(item) 
                    }));
                    console.log("Processed choices for onChoicesLazyLoad:", addressChoices);
                    
                    // The ALS API response might include a total count (e.g., data.totalNum, data.resultNum)
                    // For simplicity, we'll use a large number if not available, or refine if API provides total.
                    // If API gives total: options.setItems(addressChoices, data.totalNumberOfResults);
                    options.setItems(addressChoices, addressChoices.length); // A way to imply more items if take limit is hit

                } else {
                    console.warn("ALS API response 'results' is not an array or data is missing (onChoicesLazyLoad):", data);
                    options.setItems([], 0);
                }
            } catch (error) {
                console.error("Failed to fetch or process addresses from ALS (onChoicesLazyLoad):", error);
                options.setItems([], 0); 
            }
        }
    });
    console.log("'onChoicesLazyLoad' handler attached to survey model.");

    survey.onGetChoiceDisplayValue.add((sender, options) => {
            // Check if this event is for our specific address question
        if (options.question.name === "hk_address_als") {
            console.log(`onGetChoiceDisplayValue triggered for ${options.question.name}`, options.values);
            // options.values is an array of values for which display text is needed.
            // Since our value is the full object, the display text is derived from it.
            const displayItems = [];
            if (options.values && Array.isArray(options.values)) {
                options.values.forEach(valueObject => {
                    if (valueObject) { // valueObject is the full address JSON
                        displayItems.push({
                            value: valueObject, 
                            text: getAddressDisplayText(valueObject)
                        });
                    }
                });
            }
            if (displayItems.length > 0) {
                // For onGetChoiceDisplayValue, options.setItems expects an array of { value, text } pairs
                // or just an array of display texts if values are simple.
                // Since our values are complex objects, we must ensure what we provide matches.
                // The primary use here is if a survey is loaded with survey.data = { hk_address_als: {...} }
                // and SurveyJS needs to render the display value for that pre-set data.
                    options.setItems(displayItems.map(item => item.text)); // SurveyJS expects display strings here.
                console.log("Display values provided by onGetChoiceDisplayValue:", displayItems.map(item => item.text));
            } else {
                // If no values, or values are null/undefined, call with empty array.
                options.setItems([]);
            }
        }
    });
    console.log("'onGetChoiceDisplayValue' handler attached to survey model.");

}
