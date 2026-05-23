# Claude Code Android アプリの動作確認プラン

## Context

ユーザーの依頼により Android 向け Claude Code 開発環境アプリ（Kotlin + Jetpack Compose + Monaco Editor + Claude API）を自律的に開発し、ビルドまで完了。APKは正常に生成済み（17.68MB、`C:\Users\matty\ClaudeCodeAndroid\app\build\outputs\apk\debug\app-debug.apk` および デスクトップにコピー済み）。

しかし、Androidエミュレータの起動に失敗。診断の結果、根本原因は **CPU仮想化機能（AMD-V / SVM Mode）がBIOSで無効化されている** ことが判明：

```
CPU: AMD Ryzen 5 3600
VirtualizationFirmwareEnabled: False  ← 問題
VMMonitorModeExtensions: True         ← CPU自体は対応
```

WHPX 有効化（DISM）と AEHD ドライバインストールはAI側で試行済みだが、SVMが無効なため AEHD は起動できず（エラー `0xffffffa1`）、WHPX も再起動後に有効化されてもCPU仮想化がないと機能しない。

ユーザーは「BIOSでSVM有効化（中期的に便利）」を選択。この設定変更により今後 Android Emulator / Docker Desktop / WSL2 / VirtualBox 等の全ての仮想化技術が利用可能になる。

**ハードウェア構成**:
- マザーボード: ASUS PRIME B450M-A (Rev X.0x)
- BIOS: AMI (American Megatrends Inc.) version 2006 (2019/11/13)
- CPU: AMD Ryzen 5 3600

---

## 実行ステップ

### ステップ1: 作業内容の保存（PC再起動の前準備）

ユーザーが実施。
- 開いている全アプリケーションのデータを保存
- ブラウザのタブ等、再開後に必要なものをブックマーク

### ステップ2: PowerShellから再起動コマンド実行

```powershell
Restart-Computer -Force
```

または通常のスタートメニュー → 電源 → 再起動。

### ステップ3: ASUS BIOS（UEFI BIOS Utility）に入る

1. PCが起動を始めたら、ASUSロゴが表示された瞬間から **`Delete` キーを連打**
   - 反応しない場合は `F2` キーで代替
   - タイミングがシビアなので、再起動直後から押し始めるのが確実
2. 「ASUS UEFI BIOS Utility - EZ Mode」画面が表示される

### ステップ4: SVM Mode を有効化

ASUS PRIME B450M-A の BIOS v2006 の場合の正確なパス:

1. 右上の **「Advanced Mode (F7)」** をクリック、または `F7` キーを押す
2. 上部タブから **「Advanced」** を選択
3. **「CPU Configuration」** をクリック
4. リストの下の方にある **「SVM Mode」** を見つける
5. 値を **「Disabled」 → 「Enabled」** に変更
6. `F10` キーを押す → 「Save changes and reset?」で **「Yes」** または **「OK」**
7. PCが自動再起動

### ステップ5: Windows起動後、仮想化の有効化を確認

```powershell
$cpu = Get-CimInstance Win32_Processor
Write-Host "VirtualizationFirmwareEnabled: $($cpu.VirtualizationFirmwareEnabled)"
# 期待値: True
```

もし `False` のままの場合 → BIOSの保存が正しく行われていない可能性。ステップ3に戻る。

### ステップ6: Androidエミュレータの起動

```powershell
$emulator = "C:\Users\matty\AppData\Local\Android\Sdk\emulator\emulator.exe"
& $emulator -avd Medium_Phone_API_35
```

初回起動は2〜5分。Androidホーム画面が表示されるまで待機。

### ステップ7: APKのインストールとアプリ起動

別のPowerShellウィンドウで:

```powershell
$adb = "C:\Users\matty\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apk = "C:\Users\matty\ClaudeCodeAndroid\app\build\outputs\apk\debug\app-debug.apk"

& $adb wait-for-device
& $adb install -r $apk
& $adb shell am start -n "com.claudecode.android/.MainActivity"
```

### ステップ8: アプリの動作確認

エミュレータ画面で:
1. **Claude Code** アプリが起動
2. 右上の **⚙ 設定アイコン** をタップ
3. **Anthropic API Key** を入力（https://console.anthropic.com で取得）
4. **Save Settings** をタップ → 戻る
5. 左ペインのファイルツリーから任意のファイルを開く（または「+」で新規作成）
6. Monaco Editor でコード編集
7. 右ペインの **Claude チャット** に質問を入力し、ストリーミング応答を確認

---

## 確認したい主要動作

- [ ] アプリが起動し、3ペインレイアウト（ファイルツリー / エディタ / チャット）が表示される
- [ ] 設定画面でAPIキー保存ができる
- [ ] 新規ファイル作成 → Monaco Editorで編集 → 保存（Ctrl+S または保存ボタン）→ 再読込で内容が保持される
- [ ] Claude APIへのチャット送信が成功し、ストリーミングで応答が表示される
- [ ] 現在開いているファイルがチャットのコンテキストに含まれる（質問内容で確認）
- [ ] ファイルツリーのトグル、チャットパネルのトグルが正常動作
- [ ] ダーク/Catppuccinテーマの視認性

---

## トラブルシューティング

### BIOSにSVM Modeが見つからない
- 「CPU Configuration」内の項目名が異なる場合あり：
  - `AMD-V`, `Virtualization Technology`, `Secure Virtual Machine`, `SVM Support`
- 古いBIOSの場合 `Advanced > CPU > Virtualization Features` の下にある場合あり

### F7でAdvanced Modeに切り替わらない
- 既にAdvanced Modeになっている可能性 → 直接「Advanced」タブをクリック

### SVM有効化後もエミュレータが起動しない
1. AEHDの再有効化を試みる（管理者PowerShellで）:
   ```powershell
   sc start aehd
   ```
2. それでもダメなら、WHPXに切り替える:
   ```powershell
   # 管理者で
   bcdedit /set hypervisorlaunchtype auto
   # 再起動
   ```

### エミュレータの代わりに実機を使う場合
Android端末を「設定 > デバイス情報 > ビルド番号を7回タップ」で開発者モード有効化 → 「開発者向けオプション > USBデバッグ」をON → USB接続 → `adb devices` で確認後、ステップ7のインストールコマンドを実行。

---

## 関連ファイル

- ビルド済みAPK: `C:\Users\matty\ClaudeCodeAndroid\app\build\outputs\apk\debug\app-debug.apk`
- デスクトップコピー: `C:\Users\matty\OneDrive\デスクトップ\ClaudeCode-debug.apk`
- アーキテクチャドキュメント: `C:\Users\matty\ClaudeCodeAndroid\docs\architecture.md`
- プロジェクトルート: `C:\Users\matty\ClaudeCodeAndroid\`

## なぜこの手順なのか（補足）

- **BIOSでSVMを有効化する以外の選択肢が消去されている理由**:
  - CPU自体は仮想化対応（`VMMonitorModeExtensions: True`）だが、BIOSが機能をブロック中
  - WHPX / AEHD / Hyper-V いずれもCPU仮想化機能がアクティブでないと動作不可
  - BIOSの設定は OS から書き換えできない（セキュリティ上の仕様）
  - 物理的なキー操作（Delete/F2）が必須

- **ASUS PRIME B450M-A 固有の情報**:
  - メーカー公式: BIOS入りキーは `Delete`（推奨）または `F2`
  - SVM Mode のパス: `Advanced > CPU Configuration > SVM Mode`
  - 設定後は `F10` で保存して再起動が標準フロー
