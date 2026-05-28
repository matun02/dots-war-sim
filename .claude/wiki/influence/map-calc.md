> truth source: `packages/core/src/sim/influence-map.ts`

- データ: `Int16Array(width * height)` × 陣営数
- 計算:
  1. 全セル0クリア
  2. 各ユニット位置に円形フォールオフ加算
     - 半径R=10, 線形減衰: `weight * (R² - d²) / R²`
     - light=100, heavy=200
  3. 所有都市位置に city_weight=300 加算(同フォールオフ)
  4. 3回ガウシアン平滑化(3×3 box blur)
- 更新頻度: 5tickごと(10Hz)
- 整数演算のみ(決定論維持)
