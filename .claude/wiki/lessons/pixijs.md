> 完了タスクから抽出した教訓。

- v8: `new Application()`後に`await app.init(options)`(async init)
- v8: Graphics APIがv7から変更
- WebGL Canvas: Chrome拡張・デスクトップ両方でスクリーンショット黒画面→JS状態検証が最初の手段
- DPR=0.75: Chrome MCP座標とCSSピクセル座標にスケーリング差
- `generateTexture`: `Texture`を返す(RenderTextureではない)
- Spriteプールパターンで効率的描画
