# zaicoregister

zaico登録コマンド

## 使い方

```
Usage: zaicoregister [options] [files...]

	--help, -h
		Displays help information about this script
		'index.js -h' or 'index.js --help'

	--cache, -c
		enable cache

	--dryrun
		dry run mode

	--force, -f
		force mode

	--mode, -m
		run mode. verify(default), add, update, delete, updateAdd, cache, deleteDuplicate

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
| dryrun    | ドライランモード。追加・削除・更新のリクエストはされないのでサーバーのデータは変わらない |

- add, update, delete, updateAdd では処理前に全データを全て取得する
  -　```-c``` オプションをつけた場合、キャッシュファイルがあればデータはそこから取得し、処理後に更新する
- cacheはキャシュのみ更新する
- add ではデフォルトはJANが存在するデータはメッセージを表示して登録しない
  - ```-f``` オプションをつけた場合、JANが存在しても追加する
- deleteDuplicate はキャッシュデータの重複がある場合、作成時と更新時が違うデータが１つ以上ある場合に作成日時と更新日時が同じデータを削除する
  - ```-f``` オプションをつけると、作成日時と更新日時が違うデータがなくても削除する（つまり対象のJANはなくなる）


#### 例

キャッシュを更新

```
zaicoregister -m cache
```

zaico追加・削除・更新

```
zaicoregister -c -m add jangetterの出力data.json       # JANが重複してるものは追加しない
zaicoregister -f -c -m add jangetterの出力data.json    # JANが重複していても追加する
zaicoregister -c -m update jangetterの出力data.json    # JANが見つからないものはエラー、あれば更新
zaicoregister -c -m updateAdd jangetterの出力data.json # JANがあれば更新、なければ追加
zaicoregister -c -m delete jangetterの出力data.json    # JANが見つからないものはエラー、あれば削除
```

※ -c をつけない場合には全データをzaicoから都度とってくるので頻繁にやる場合にはキャッシュを使うこと

dryrun

```
zaicoregister -c -m delete jangetterの出力data.json    # 実際にサーバーからは削除されない
```

重複削除

```
zaicoregister -c -m deleteDuplicate    # 重複削除。更新日時と作成日時が別のものがないものは削除しない
zaicoregister -f -c -m deleteDuplicate # 重複削除。更新日時と作成日時が別のものがないものも削除
```
