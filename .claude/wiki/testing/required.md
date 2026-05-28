| 対象 | テスト |
|---|---|
| RNG | seed→同列で同じ乱数 |
| A* | 山迂回/到達不能null/同コストtie-break決定論 |
| tick | 同入力で同出力(reset→1000tick→hash等価) |
| リプレイ | record→replayでハッシュ完全一致 |
| AI | 中立都市があれば必ず奪いに行く等の不変条件 |
