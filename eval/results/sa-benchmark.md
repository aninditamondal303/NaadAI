# Sa detection benchmark (synthetic phrases)

56 synthetic 20-second phrases: 4 raags (Yaman, Bhairav, Bhupali, Malkauns) x 14 Sa values from 110 Hz to 233 Hz.
Synthetic signals are easier than real singing; real-voice results are reported separately.

Raag known = the singer chose the raag in the app. Voice type known = they picked male or female Sa at sign-up (used only to choose the octave). Nothing known = Sa + Pa method only.

| Mode | Raag | Within ±20 cents | Within ±50 cents | Octave-correct | Marked unsure |
|---|---|---|---|---|---|
| raag + voice type known | Yaman | 100.0% | 100.0% | 100.0% | 0.0% |
| raag + voice type known | Bhairav | 100.0% | 100.0% | 100.0% | 0.0% |
| raag + voice type known | Bhupali | 100.0% | 100.0% | 100.0% | 0.0% |
| raag + voice type known | Malkauns | 100.0% | 100.0% | 100.0% | 0.0% |
| raag + voice type known | All | 100.0% | 100.0% | 100.0% | 0.0% |
| raag known | Yaman | 85.7% | 85.7% | 85.7% | 0.0% |
| raag known | Bhairav | 100.0% | 100.0% | 100.0% | 0.0% |
| raag known | Bhupali | 92.9% | 92.9% | 92.9% | 0.0% |
| raag known | Malkauns | 85.7% | 85.7% | 85.7% | 0.0% |
| raag known | All | 91.1% | 91.1% | 91.1% | 0.0% |
| nothing known | Yaman | 85.7% | 85.7% | 85.7% | 7.1% |
| nothing known | Bhairav | 28.6% | 28.6% | 28.6% | 78.6% |
| nothing known | Bhupali | 92.9% | 92.9% | 92.9% | 7.1% |
| nothing known | Malkauns | 0.0% | 0.0% | 21.4% | 35.7% |
| nothing known | All | 51.8% | 51.8% | 57.1% | 32.1% |

## Misses

| Mode | Raag | True Sa (Hz) | Error (cents) | Unsure |
|---|---|---|---|---|
| raag known | Yaman | 110.0 | -1200 | false |
| nothing known | Yaman | 110.0 | -1200 | false |
| raag known | Yaman | 174.6 | -1200 | false |
| nothing known | Yaman | 174.6 | -1200 | false |
| nothing known | Bhairav | 110.0 | -700 | true |
| nothing known | Bhairav | 123.5 | -700 | true |
| nothing known | Bhairav | 138.6 | -700 | true |
| nothing known | Bhairav | 155.6 | -700 | true |
| nothing known | Bhairav | 174.6 | -700 | true |
| nothing known | Bhairav | 185.0 | -700 | true |
| nothing known | Bhairav | 196.0 | -700 | false |
| nothing known | Bhairav | 207.7 | -700 | true |
| nothing known | Bhairav | 220.0 | -700 | true |
| nothing known | Bhairav | 233.1 | -700 | true |
| raag known | Bhupali | 185.0 | -1200 | false |
| nothing known | Bhupali | 185.0 | -1200 | false |
| nothing known | Malkauns | 110.0 | 500 | true |
| nothing known | Malkauns | 116.5 | -700 | true |
| nothing known | Malkauns | 123.5 | -700 | false |
| nothing known | Malkauns | 130.8 | -700 | false |
| raag known | Malkauns | 138.6 | 1200 | false |
| nothing known | Malkauns | 138.6 | 500 | true |
| nothing known | Malkauns | 146.8 | -700 | true |
| nothing known | Malkauns | 155.6 | 500 | true |
| nothing known | Malkauns | 164.8 | -700 | false |
| nothing known | Malkauns | 174.6 | -700 | false |
| nothing known | Malkauns | 185.0 | -700 | false |
| nothing known | Malkauns | 196.0 | -700 | false |
| nothing known | Malkauns | 207.7 | -700 | false |
| nothing known | Malkauns | 220.0 | -700 | false |
| raag known | Malkauns | 233.1 | -1200 | false |
| nothing known | Malkauns | 233.1 | -700 | false |
