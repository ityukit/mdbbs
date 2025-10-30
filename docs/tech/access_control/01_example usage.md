このアクセス制御システム (access.js) の実際の使い方の例を、初めて使う方にもわかりやすく説明しますね。

このシステムは主に、**「ある人が、特定のモノに対して、特定のアクション（操作）をして良いか？」** をチェックするために使います。また、そのルールを設定するための機能も提供しています。

---

## **使い方 1：権限があるかチェックする 🤔✅**

一番よく使うのが、**権限チェック**です。アプリケーションの様々な場所で、「このユーザーはこの操作をしていいか？」を確認する必要があります。

**例：ユーザーA (ID: 5\) が、ツリーB (ID: 10\) の内容を一覧表示 (tree.list) できるかチェックしたい場合**

JavaScript
```
// access.js をインポート (import access from './access.js'; など)  
// db トランザクション (trx) を用意

// チェックしたいユーザーのID  
const userIdToCheck = 5;   
// チェックしたいアクションの名前  
const actionName = 'tree.list';  
// チェックしたいモノの種類 (TREE) と ID (10)  
const target = access.TARGET_TREE; // access.js で定義されている定数を使います  
const targetId = 10;  
// (もしあれば) モノの所有者情報など (今回は不要なので空オブジェクト)  
const selfObject = { userids: [], groupids: [], tierids: [] }; 

// 権限チェックを実行！  
const canListTree = await access.isAllowed(trx, userIdToCheck, actionName, target, targetId, selfObject);

if (canListTree) {  
  console.log("ユーザーID 5 は ツリーID 10 を一覧表示できます 👍");  
  // ここで実際に一覧表示する処理を行う  
} else {  
  console.log("ユーザーID 5 は ツリーID 10 を一覧表示できません 🚫");  
  // エラーメッセージを表示するなど  
}
```

**ポイント:**

* access.isAllowed 関数を使います。  
* 引数として「誰が」「何を」「どのモノに対して」行うかを指定します。  
* 結果は true（許可）か false（拒否）で返ってきます。

**応用:** 複数の権限を一度にチェックしたい場合は isMultipleAllowed を使うと効率的です。

---

## **使い方 2：権限ルールを設定・変更する ✍️🔄**

システム管理画面などで、権限ルールを設定したり変更したりする際に使います。ルールは「ルールブック（コンテキスト）」に紐づけます。

**例：ツリーC (ID: 12\) に関連付けられたルールブック (コンテキストID: 8\) に、新しいルールを追加したい場合**

JavaScript
```
// まず、ツリーC (ID: 12) がどのコンテキストIDを持っているか確認します。  
// (例として、コンテキストID 8 に紐づいているとします)  
const contextId = 8; 

// 追加したいルール:   
// 「ユーザーID 7 に対して、'tree.update' (ツリー更新) を許可する」  
const actionNameToAdd = 'tree.update';  
const actionId = await getActionIdByName(trx, actionNameToAdd); // アクション名をIDに変換するヘルパー関数が必要  
const unitToAdd = access.UNIT_USER; // ユーザー単位のルール  
const unitIdToAdd = 7; // ユーザーID 7  
const allow = true; // 許可  
const source = access.SOURCE_DIRECT; // 管理画面から直接設定した印  
const sourceId = 0; // (今回は特定ソースなし)

// ルールを一番優先度が高い(最初に見つかる)ように追加  
await access.unshiftAccessRule(trx, contextId, actionId, unitToAdd, unitIdToAdd, allow, source, sourceId);  
console.log(`コンテキストID ${contextId} にルールを追加しました。`);

// 重要：キャッシュをクリアする  
// access.js の関数は内部でキャッシュクリアを行いますが、  
// 念のため、関連するキャッシュを手動でクリアすることも推奨されます。  
// await cache.del(`rules:isAllowed:TREE:12`); // 例: ツリーCのキャッシュをクリア
```

**ポイント:**

* ルールは access\_rules テーブル に保存されます。  
* pushAccessRule（優先度低く追加）や unshiftAccessRule（優先度高く追加）、setAccessRule（ルール全入れ替え）などを使ってルールを操作します。  
* ルール変更後は、関連する**キャッシュのクリア**が非常に重要です。access.js の関数は自動で行ってくれますが、仕組みを理解しておくことが大切です。

---

## **使い方 3：ユーザー・グループ・Tier（役割）を管理する 🧑‍🤝‍🧑👑**

ユーザーをグループに追加したり、ユーザーやグループに役割（Tier）を割り当てたりする際に使います。

**例1：ユーザーID 9 を グループID 3 に追加する**

JavaScript
```
const userId = 9;  
const groupId = 3;

await access.addGroup(trx, userId, groupId);   
console.log(`ユーザーID ${userId} を グループID ${groupId} に追加しました。`);  
// addGroup は内部で関連キャッシュ (グループリスト、Tierリスト) をクリアします
```

**例2：プロジェクトX (コンテキストID: 15) において、ユーザーID 9 に リーダーTier (Tier ID: 2) を割り当てる**

JavaScript
```
const userId = 9;  
const tierId = 2; // リーダーTierのID  
const contextId = 15; // プロジェクトXのコンテキストID

await access.addTier_User(trx, userId, tierId, contextId);  
console.log(`コンテキストID ${contextId} において、ユーザーID ${userId} に Tier ID ${tierId} を割り当てました。`);  
// addTier_User は内部で関連キャッシュ (Tierリスト) をクリアします
```

**ポイント:**

* addGroup, removeGroup, addTier\_User, removeTier\_User, addTier\_Group, removeTier\_Group などの関数を使います。  
* これらの関数は、変更後に**自動的に関連するキャッシュをクリア**してくれるため、権限がすぐに反映されます。

---

このように、access.js は「権限チェック」と「ルールや所属情報の管理」という2つの側面で利用されます。特に「使い方1：権限があるかチェックする」は、アプリケーションのあらゆる場所で必要になる基本的な使い方です。
