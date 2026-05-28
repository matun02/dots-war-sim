> 完了タスクから抽出した教訓。

- vitest fake timers: RAFは16ms間隔
- IEEE 754浮動小数tick境界誤差→1e-6 epsilonガード
- `vi.spyOn`: ESM namespace importに対して正常動作
- 影響マップテスト: マップサイズはフォールオフ半径(R=10)より十分大きく(8x6→32x24)
- domination: 中立都市なし環境ではannihilation到達不能(全都市所有→domination先に発火)
- マーチングスクエア: ambiguous case(5,10)のサドルポイント。影響マップ拡散特性上問題なし
- `structuredClone`: tickのdeep cloneでimmutability保証
