// Auto-generated static protocol library
window.DEFAULT_PROTOCOLS = [
  {
    "id": "abvd",
    "name": "ABVD",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Doxorubicin",
          "dose_per_bsa": 25,
          "unit": "mg/m²",
          "route": "IV Bolus",
          "duration": "10-15 min",
          "is_anthracycline": true
        },
        {
          "drug": "Bleomycin",
          "dose_per_bsa": 10,
          "unit": "Units/m²",
          "route": "IV Push",
          "duration": "10 min"
        },
        {
          "drug": "Vinblastine",
          "dose_per_bsa": 6,
          "unit": "mg/m²",
          "route": "IV Push",
          "duration": "5 min"
        },
        {
          "drug": "Dacarbazine",
          "dose_per_bsa": 375,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "30-60 min"
        }
      ],
      "post_meds": [],
      "home_post_meds": []
    }
  },
  {
    "id": "act",
    "name": "AC-T (Doxorubicin + Cyclophosphamide -> Paclitaxel)",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Aprepitant",
          "dose": 125,
          "unit": "mg",
          "route": "PO",
          "duration": "Uygulamadan 1 saat önce"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Doxorubicin",
          "dose_per_bsa": 60,
          "unit": "mg/m²",
          "route": "IV Bolus",
          "duration": "10-15 min",
          "is_anthracycline": true
        },
        {
          "drug": "Cyclophosphamide",
          "dose_per_bsa": 600,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "30-60 min"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Aprepitant",
          "dose": "80mg",
          "frequency": "1x1",
          "duration": "2. ve 3. gün"
        },
        {
          "drug": "Dexamethasone",
          "dose": "8mg",
          "frequency": "1x1",
          "duration": "2. ve 3. gün"
        },
        {
          "drug": "Filgrastim (G-CSF)",
          "dose": "30 MU (300 mcg)",
          "route": "SC",
          "frequency": "1x1",
          "duration": "24 saat sonra, 5-7 gün"
        }
      ]
    }
  },
  {
    "id": "bep",
    "name": "BEP",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Mannitol 20%",
          "dose": 250,
          "unit": "mL",
          "route": "IV Infüzyon",
          "duration": "Cisplatin'den hemen önce (Böbrek koruması)"
        },
        {
          "drug": "SF (İzotonik Hidrasyon)",
          "dose": 1000,
          "unit": "mL",
          "route": "IV Infüzyon",
          "duration": "1 saatte"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Bleomycin",
          "dose_per_bsa": 30,
          "unit": "Units/m²",
          "route": "IV Push",
          "duration": "10 min (Sadece Gün 1, 8, 15)"
        },
        {
          "drug": "Etoposide",
          "dose_per_bsa": 100,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "60 min (Gün 1-5)"
        },
        {
          "drug": "Cisplatin",
          "dose_per_bsa": 20,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "60 min (Gün 1-5)"
        }
      ],
      "post_meds": [
        {
          "drug": "SF (İzotonik Hidrasyon + Magnezyum)",
          "dose": 1000,
          "unit": "mL",
          "route": "IV Infüzyon",
          "duration": "2 saatte"
        }
      ],
      "home_post_meds": []
    }
  },
  {
    "id": "folfiri",
    "name": "FOLFIRI",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Atropine",
          "dose": 0.25,
          "unit": "mg",
          "route": "SC",
          "duration": "İrinotekan öncesi (Kolinerjik sendrom profilaksisi)"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Irinotecan",
          "dose_per_bsa": 180,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "90 min"
        },
        {
          "drug": "Leucovorin",
          "dose_per_bsa": 400,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "2 saat"
        },
        {
          "drug": "5-Fluorouracil (Bolus)",
          "dose_per_bsa": 400,
          "unit": "mg/m²",
          "route": "IV Bolus",
          "duration": "5 min"
        },
        {
          "drug": "5-Fluorouracil (İnfüzyon)",
          "dose_per_bsa": 2400,
          "unit": "mg/m²",
          "route": "IV İnfüzyon (Pompa)",
          "duration": "46 saat"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Loperamide",
          "dose": "2mg",
          "frequency": "İshal durumunda",
          "duration": "İhtiyaç halinde"
        }
      ]
    }
  },
  {
    "id": "folfox",
    "name": "FOLFOX (mFOLFOX6)",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Oxaliplatin",
          "dose_per_bsa": 85,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "2 saat"
        },
        {
          "drug": "Leucovorin",
          "dose_per_bsa": 400,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "2 saat (Oxaliplatin ile eş zamanlı)"
        },
        {
          "drug": "5-Fluorouracil (Bolus)",
          "dose_per_bsa": 400,
          "unit": "mg/m²",
          "route": "IV Bolus",
          "duration": "5 min"
        },
        {
          "drug": "5-Fluorouracil (İnfüzyon)",
          "dose_per_bsa": 2400,
          "unit": "mg/m²",
          "route": "IV İnfüzyon (Pompa)",
          "duration": "46 saat"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Metoclopramide",
          "dose": "10mg",
          "frequency": "3x1",
          "duration": "3 gün (İhtiyaç halinde)"
        }
      ]
    }
  },
  {
    "id": "paclitaxel_weekly",
    "name": "Paclitaxel (Haftalık)",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Dexamethasone",
          "dose": 10,
          "unit": "mg",
          "route": "IV",
          "duration": "Uygulamadan 30 dk önce"
        },
        {
          "drug": "Pheniramine",
          "dose": 45.5,
          "unit": "mg",
          "route": "IV",
          "duration": "Uygulamadan 30 dk önce"
        },
        {
          "drug": "Ranitidine",
          "dose": 50,
          "unit": "mg",
          "route": "IV",
          "duration": "Uygulamadan 30 dk önce"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Paclitaxel",
          "dose_per_bsa": 80,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "1 saat"
        }
      ],
      "post_meds": [],
      "home_post_meds": []
    }
  },
  {
    "id": "pembrolizumab",
    "name": "Pembrolizumab (Monoterapi)",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [],
      "chemotherapy": [
        {
          "drug": "Pembrolizumab",
          "flat_dose": 200,
          "unit": "mg",
          "route": "IV Infüzyon",
          "duration": "30 min"
        }
      ],
      "post_meds": [],
      "home_post_meds": []
    }
  },
  {
    "id": "r-chop",
    "name": "R-CHOP",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Paracetamol",
          "dose": 1000,
          "unit": "mg",
          "route": "PO",
          "duration": "Rituximab'dan 30 dk önce"
        },
        {
          "drug": "Pheniramine",
          "dose": 45.5,
          "unit": "mg",
          "route": "IV",
          "duration": "Rituximab'dan 30 dk önce"
        },
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Rituximab",
          "dose_per_bsa": 375,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "Kademeli hız artışıyla (Örn: 50 mg/saat ile başla)"
        },
        {
          "drug": "Cyclophosphamide",
          "dose_per_bsa": 750,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "30-60 min"
        },
        {
          "drug": "Doxorubicin",
          "dose_per_bsa": 50,
          "unit": "mg/m²",
          "route": "IV Bolus",
          "duration": "10-15 min",
          "is_anthracycline": true
        },
        {
          "drug": "Vincristine",
          "dose_per_bsa": 1.4,
          "max_dose": 2,
          "unit": "mg/m²",
          "route": "IV İnfüzyon",
          "duration": "10-15 min"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Prednisolone",
          "dose_per_bsa": 40,
          "unit": "mg/m²",
          "route": "PO",
          "frequency": "1x1",
          "duration": "1. günden 5. güne kadar"
        }
      ]
    }
  },
  {
    "id": "tc",
    "name": "TC (Docetaxel + Cyclophosphamide)",
    "phases": {
      "home_pre_meds": [
        {
          "drug": "Dexamethasone",
          "dose": 8,
          "unit": "mg",
          "route": "PO",
          "frequency": "2x1",
          "duration": "Kemoterapiden 1 gün önce başla, 3 gün devam et"
        }
      ],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Docetaxel",
          "dose_per_bsa": 75,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "60 min"
        },
        {
          "drug": "Cyclophosphamide",
          "dose_per_bsa": 600,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "30-60 min"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Filgrastim (G-CSF)",
          "dose": "30 MU (300 mcg)",
          "route": "SC",
          "frequency": "1x1",
          "duration": "24 saat sonra, 5-7 gün"
        }
      ]
    }
  },
  {
    "id": "test_protocol",
    "name": "Test Protocol",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [],
      "chemotherapy": [
        {
          "drug": "TestDrug",
          "dose": 10
        }
      ],
      "post_meds": [],
      "home_post_meds": []
    }
  },
  {
    "id": "xelox",
    "name": "XELOX (CAPOX)",
    "phases": {
      "home_pre_meds": [],
      "pre_meds": [
        {
          "drug": "Ondansetron",
          "dose": 8,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        },
        {
          "drug": "Dexamethasone",
          "dose": 12,
          "unit": "mg",
          "route": "IV",
          "duration": "15 min"
        }
      ],
      "chemotherapy": [
        {
          "drug": "Oxaliplatin",
          "dose_per_bsa": 130,
          "unit": "mg/m²",
          "route": "IV Infüzyon",
          "duration": "2 saat"
        }
      ],
      "post_meds": [],
      "home_post_meds": [
        {
          "drug": "Capecitabine",
          "dose_per_bsa": 1000,
          "unit": "mg/m²",
          "route": "PO",
          "frequency": "2x1",
          "duration": "14 gün (1. günden 14. güne kadar)"
        }
      ]
    }
  }
];
