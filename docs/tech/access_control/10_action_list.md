# アクション一覧

* **開発途中、かつ、Geminiによる自動生成なので間違っていることがあります**

----

このシステムで定義されている「**アクション（操作権限）**」について、それぞれ簡単な仕様説明を付けた一覧表を作成します。

`access.js` の権限チェック は、アプリケーション側（`db/seeds/20250726_140001_00_all_actions.js` や `db/seeds/default/20250726_140001_01_actions.js`）で定義されたこれらの「アクション名」に対して行われます。

---

### アクション（権限）一覧

| アクション名 | 簡単な仕様説明 |
| :--- | :--- |
| **ツリー (Tree) 関連** | |
| `tree.list` | ツリーの一覧を表示する権限 |
| `tree.get` | 特定のツリーの基本情報を取得する権限 |
| `tree.create` | 新しいツリーを作成する権限 |
| `tree.update` | ツリーの情報（名前など）を更新する権限 |
| `tree.delete` | ツリーを削除する権限 |
| `tree.move` | ツリーを移動する権限 |
| `tree.getwithstatus` | ツリーの有効/無効ステータスを含めて情報を取得する権限 |
| `tree.updatestatus` | ツリーの有効/無効ステータスを変更する権限 |
| **スレッド (Thread) 関連** | |
| `thread.list` | スレッドの一覧を表示する権限 |
| `thread.get` | 特定のスレッドの基本情報を取得する権限 |
| `thread.create` | 新しいスレッドを作成する権限 |
| `thread.update` | スレッドの情報（タイトルなど）を更新する権限 |
| `thread.delete` | スレッドを削除する権限 |
| `thread.move` | スレッドを移動する権限 |
| `thread.getwithstatus` | スレッドの有効/無効ステータスを含めて情報を取得する権限 |
| `thread.updatestatus` | スレッドの有効/無効ステータスを変更する権限 |
| **コンテンツ (Contents) 関連** | |
| `contents.list` | コンテンツの一覧を表示する権限 |
| `contents.get` | 特定のコンテンツの基本情報を取得する権限 |
| `contents.create` | 新しいコンテンツを作成する権限 |
| `contents.update` | コンテンツの情報（本文など）を更新する権限 |
| `contents.delete` | コンテンツを削除する権限 |
| `contents.move` | コンテンツを移動する権限 |
| `contents.getwithstatus` | コンテンツの有効/無効ステータスを含めて情報を取得する権限 |
| `contents.updatestatus` | コンテンツの有効/無効ステータスを変更する権限 |
| `contents.history` | コンテンツの変更履歴を表示する権限 |
| **ユーザー (User) 関連** | |
| `user.list` | ユーザーの一覧を表示する権限 |
| `user.get` | ユーザーの基本情報（ID、表示名など）を取得する権限 |
| `user.create` | 新しいユーザーを作成する権限 |
| `user.update` | ユーザー情報を更新する権限 |
| `user.delete` | ユーザーを削除する権限 |
| `user.move` | ユーザーを（他の場所に）移動する権限 |
| `user.getwithstatus` | ユーザーの有効/無効/ロック状態を含めて情報を取得する権限 |
| `user.updatestatus` | ユーザーの有効/無効/ロック状態を変更する権限 |
| `user.get_sensitive` | ユーザーの機密情報（ログインIDなど）を取得する権限 |
| `user.getDetails` | ユーザーの全詳細情報（メールアドレス、説明文など）を取得する権限 |
| `user.updatePassword` | （管理者による）他ユーザーのパスワードを更新する権限 |
| `user.updateSelfPassword` | ユーザーが自分自身のパスワードを更新する権限 |
| **グループ (Group) 関連** | |
| `group.list` | グループの一覧を表示する権限 |
| `group.get` | グループの基本情報（ID、グループ名など）を取得する権限 |
| `group.create` | 新しいグループを作成する権限 |
| `group.update` | グループ情報（名前、説明文など）を更新する権限 |
| `group.delete` | グループを削除する権限 |
| `group.move` | グループを（階層内で）移動する権限 |
| `group.getwithstatus` | グループの有効/無効/ロック状態を含めて情報を取得する権限 |
| `group.updatestatus` | グループの有効/無効/ロック状態を変更する権限 |
| `group.getSensitive` | グループの機密情報（所属ユーザー一覧など）を取得する権限 |
| `group.getDetails` | グループの詳細情報（説明文など）を取得する権限 |
| `group.addUser` | グループにユーザーを追加する権限 |
| `group.removeUser` | グループからユーザーを削除する権限 |
| **Tier (役割) 関連** | |
| `tier.list` | Tierの一覧を表示する権限 |
| `tier.get` | 特定のTierの基本情報を取得する権限 |
| `tier.create` | 新しいTierを作成する権限 |
| `tier.update` | Tierの情報（名前など）を更新する権限 |
| `tier.delete` | Tierを削除する権限 |
| `tier.move` | Tierを（階層内で）移動する権限 |
| `tier.getwithstatus` | Tierの有効/無効ステータスを含めて情報を取得する権限 |
| `tier.updatestatus` | Tierの有効/無効ステータスを変更する権限 |
| `tier.addUser` | Tierに直接ユーザーを割り当てる権限 |
| `tier.removeUser` | Tierからユーザーの割り当てを解除する権限 |
| `tier.addGroup` | Tierにグループを割り当てる権限 |
| `tier.removeGroup` | Tierからグループの割り当てを解除する権限 |
| **ルール (Rules) 関連** | |
| `rules.list` | 権限ルールの一覧を表示する権限 |
| `rules.get` | 特定の権限ルール（`access_rules`）の情報を取得する権限 |
| `rules.create` | 新しい権限ルールを作成する権限 |
| `rules.update` | 権限ルール（許可/拒否、`orderno`など）を更新する権限 |
| `rules.delete` | 権限ルールを削除する権限 |
| `rules.move` | 権限ルールを（別コンテキストに）移動する権限 |
| `rules.getwithstatus` | 権限ルールのステータス（もしあれば）を含めて取得する権限 |
| `rules.updatestatus` | 権限ルールのステータス（もしあれば）を変更する権限 |
| **タグ (Tag) 関連** | |
| `tag.list` | タグの一覧を表示する権限 |
| `tag.get` | 特定のタグの情報を取得する権限 |
| `tag.create` | 新しいタグを作成する権限 |
| `tag.update` | タグの情報（名前など）を更新する権限 |
| `tag.delete` | タグを削除する権限 |