Survey.ComponentCollection.Instance.add({
    name: "ethnic",
    title: {
        "default": "Ethnicity",
        "en": "Ethnicity",
        "zh-cn": "民族", // Simplified Chinese
        "zh-hk": "民族"  // Traditional Chinese (using zh-hk for Hong Kong traditional, or zh-tw for Taiwan traditional)
    },
    defaultQuestionTitle: {
        "default": "Ethnicity",
        "en": "Ethnicity",
        "zh-cn": "民族",
        "zh-hk": "民族"
    },
    questionJSON: {
        "type": "dropdown",
        "placeholder": {
            "default": "Select an ethnicity...",
            "en": "Select an ethnicity...",
            "zh-cn": "选择民族...",
            "zh-hk": "選擇民族..."
        },
        "choices": [
            {
                "value": "none",
                "text": {
                    "default": "Prefer not to say",
                    "en": "Prefer not to say",
                    "zh-cn": "不愿透露",
                    "zh-hk": "不願透露"
                }
            },
            {
                "value": "asian",
                "text": {
                    "default": "Asian",
                    "en": "Asian",
                    "zh-cn": "亚洲人",
                    "zh-hk": "亞洲人"
                }
            },
            {
                "value": "white",
                "text": {
                    "default": "White",
                    "en": "White",
                    "zh-cn": "白人",
                    "zh-hk": "白人"
                }
            },
            {
                "value": "black",
                "text": {
                    "default": "Black or African American",
                    "en": "Black or African American",
                    "zh-cn": "黑人或非洲裔美国人",
                    "zh-hk": "黑人或非洲裔美國人"
                }
            },
            {
                "value": "hispanic",
                "text": {
                    "default": "Hispanic or Latino",
                    "en": "Hispanic or Latino",
                    "zh-cn": "西班牙裔或拉丁裔",
                    "zh-hk": "西班牙裔或拉丁裔"
                }
            },
            {
                "value": "middle_eastern",
                "text": {
                    "default": "Middle Eastern or North African",
                    "en": "Middle Eastern or North African",
                    "zh-cn": "中东或北非裔",
                    "zh-hk": "中東或北非裔"
                }
            },
            {
                "value": "native_american",
                "text": {
                    "default": "Native American or Alaska Native",
                    "en": "Native American or Alaska Native",
                    "zh-cn": "美洲原住民或阿拉斯加原住民",
                    "zh-hk": "美洲原住民或阿拉斯加原住民"
                }
            },
            {
                "value": "pacific_islander",
                "text": {
                    "default": "Native Hawaiian or Other Pacific Islander",
                    "en": "Native Hawaiian or Other Pacific Islander",
                    "zh-cn": "夏威夷原住民或其他太平洋岛民",
                    "zh-hk": "夏威夷原住民或其他太平洋島民"
                }
            },
            {
                "value": "two_or_more",
                "text": {
                    "default": "Two or More Races",
                    "en": "Two or More Races",
                    "zh-cn": "两个或更多民族",
                    "zh-hk": "兩個或更多民族"
                }
            },
            {
                "value": "other",
                "text": {
                    "default": "Other",
                    "en": "Other",
                    "zh-cn": "其他",
                    "zh-hk": "其他"
                }
            }
        ]
    },
    inheritBaseProps: true
});
