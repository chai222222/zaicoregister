# zaicoregister

zaico登録コマンド

## 使い方

```
Usage: zaicoregister [options] [files...]

	--help, -h
		Displays help information about this script
		'zicoregister -h' or 'zicoregister --help'

	--cache, -c
		キャッシュモード有効にする。
		基本的にはキャッシュはファイルに作成されるが、このモードをつけない場合、最後に削除される。

	--dryrun
		dry run mode

	--force, -f
		force mode

	--latest
		keep latest in deleteDuplicate mode

	--oldest
		keep oldest in deleteDuplicate mode

	--mode, -m
		run mode. verify(default), add, update, delete, updateAdd, cache, deleteDuplicate, diffUpdate

```

### モード

| mode | 説明 |
| ---- | ---- |
| verify    | jangetterデータを元に登録済みであるかどうかなどをチェックする |
| add       | jangetterデータを登録する |
| update    | jangetterデータを元にデータを更新する |
| delete    | jangetterデータを元にデータを削除する |
| updateAdd | jangetterデータを元にデータが登録済みであれば更新し、なければ更新する |
| cache     | cacheファイルのみを更新する |
| deleteDuplicate | 重複データを削除する |

- add, update, delete, updateAdd では処理前に全データを全て取得する
  - `-c` オプションをつけた場合、キャッシュファイルがあればデータはそこから取得し、処理後に更新する
- cacheはキャシュのみ更新する
- add ではデフォルトはJANが存在するデータはメッセージを表示して登録しない
  - `-f` オプションをつけた場合、JANが存在しても追加する
- deleteDuplicate はキャッシュデータの重複がある場合、作成時と更新時が違うデータが１つ以上ある場合に作成日時と更新日時が同じデータを削除する
  - `-f` オプションをつけると、作成日時と更新日時が全て同じでも削除する（つまり対象のJANはなくなる）
  - `--oldest` オプションをつけると、作成日時と更新日時が全て同じでも一番古いもの以外は削除する
  - `--latest` オプションをつけると、作成日時と更新日時が全て同じでも一番新しいもの以外は削除する
- dryrun は ZAICO への更新・追加・削除リクエスト送らないで確認だけするオプション



#### 例

##### キャッシュを更新

```
zaicoregister -m cache
```

##### zaico追加・削除・更新

```
zaicoregister -c -m add jangetterの出力data.json       # JANが重複してるものは追加しない
zaicoregister -f -c -m add jangetterの出力data.json    # JANが重複していても追加する
zaicoregister -c -m update jangetterの出力data.json    # JANが見つからないものはエラー、あれば更新
zaicoregister -c -m updateAdd jangetterの出力data.json # JANがあれば更新、なければ追加
zaicoregister -c -m delete jangetterの出力data.json    # JANが見つからないものはエラー、あれば削除
```

※ -c をつけない場合には全データをzaicoから都度とってくるので頻繁にやる場合にはキャッシュを使うこと。
   -c をつけていてもキャッシュが無い場合は先に取得する。またつけない場合、終了時にキャッシュファイルは削除される。

##### dryrun

```
zaicoregister -c -m delete jangetterの出力data.json    # 実際にサーバーからは削除されない
```

##### 重複削除

```
zaicoregister -c -m deleteDuplicate         # 重複削除。更新日時と作成日時が別のものがないものは削除しない
zaicoregister -f -c -m deleteDuplicate      # 重複削除。更新日時と作成日時が別のものがない場合も全て削除する
zaicoregister -oldest -c -m deleteDuplicate # 重複削除。更新日時と作成日時が別のものがない場合、最古のデータ以外は削除
zaicoregister -latest -c -m deleteDuplicate # 重複削除。更新日時と作成日時が別のものがない場合、最新のデータ以外は削除
```

##### 差分更新

```
zaicoregister -c -m diffUpdate cacheファイルをコピーして編集したファイル # 差分で既存のデータを更新。IDがないもの、差分がないものは更新しない
```

---

## .zaicoregisterrc

実行ディレクトリに `.zaicoregisterrc` を用意し、環境設定する

```
{
  "token": "文字列",      // zaicoトークン
  "cacheFile": "文字列",  // キャッシュファイル名(省略時は ./zr_cache.json)
  "editedFile": "文字列", // キャッシュファイル名(省略時は ./zr_edited.json)
  "apiUrl": "文字列",     // zaico api(省略時は https://web.zaico.co.jp/api/v1/inventories)
  "waitMills": 数値,      // リクエストウエイトミリ秒(省略時は2000)
  "waitPerCount": 数値,   // ウェイトを入れ込むリクエスト数(省略時は10)
  "requestMaxPage": 数値, // 一覧取得時の最大数。０以下の場合には全て取得(省略時は0)
  "mapping": {            // jancetterとの項目マッピング定義(省略時は下記の値)
    "jan": "code",
    "picture": "item_image"
  },
  "convert": {            // コンバーター定義
    "picture": "fileToBase64"
  },
  "ignoreKeys": {
    "diffUpdate": [
      "item_image", "create_at", "update_at", "create_user_name", "update_user_name"
    ]
  },
  "replaceValue": {
    "update": {
      "optional_attributes": [
        { "regexp": [ "(\"name\": *\"キーワード\", *\"value\": *\")([^\"]+)", "" ], "replace": "$1${category}" }
      ]
    }
  },
  "assignValue": {
    "add": {
      "optional_attributes": [
        { "name": "キーワード", "value": "${category}" }
      ]
    },
    "update": {
      "optional_attributes": [
        { "name": "キーワード", "value": "${category}" }
      ]
    }
  },
  "initialValue": {
    "add": {
    },
    "update": {
    }
  }
}