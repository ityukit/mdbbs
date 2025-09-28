# 権限付与に関する考え方

## 基本

### for tree/thread/content

* list
* get
* getwithstatus
  * visible
  * enable  
  * lock
* create
* update
  * title
  * description
* updatestatus
  * visible
  * enable  
  * lock
* delete
* move
* getDefault
* updateDefault
* deleteDefault
* permread
* permchange

### for tree/thread

* getsortkey
* setsortkey
* setsortkey_range

### for thread
* tag
  * list
  * get
  * create
  * update
  * delete

### for content
* update
  * contents
* viewlog

### for user/group

* list
* get
* getwithstatus
  * visible
  * enable
  * lock
* getDetails
* create
* update
* updatestatus
  * visible
  * enable
  * lock
* detele
* permread
* permchange

### for user
* setpassword

### for group
* adduser
* removeuser
* addgroup
* removegroup

## GUIから以下のテンプレートグループ作成可能
* owner
* admin
* user
* guest

## どうやって付ける？
### target
* tree/thread/content/user/group/全体
### 単位
* user/group/全体
### 許容範囲
* allow, deny
### 優先順位
* listで先頭一致
### no rule
* allow

## 定義

* permission_inheritance

| id   | name       | parent_id |
| ---- | ----       | ----      |
| 1    | treereader | -1        |


* resources

| id   | target | targetid | inheritance_id |
| ---- | ----   | ----     | ----           |
| 1    | tree   | 1        | 1              |

unique(target,targetid)

* access_rules

| id   | inheritance_id | action  | unit | unitid | allow | orderno | source        | sourceid |
| ---- | ----           | ----    | ---- | ----   | ----  | ----    | ----          | ----     |
| 1    | 1              | list    | user | 1      | true  | 1       | tier_template | 1        |

unit: user, group, tier, any
created_by: tier_template, group_template, group, user

unique(ptaget_id,permtype,orderno)

with recursivce t_permtree
  select permtarget.id, permtree.parent_ptarget_id, permtree.child_ptarget_id
    from permtarget
    join permtree on permtree.child_ptarget_id = permtarget.id
    where permtargt.target = tree and permtarget.targetid = 1
  union all
  select permtree.child_ptarget_id as id, permtree.parent_ptarget_id, permtree.child_ptarget_id
    from t_permtree
    join permtree on permtree.child_ptarget_id = t_permtree.parent_ptarget_id
select id from t_permtree

get permtree:tree:1 1
get tier:user:1 1

select allow from permission where (ptarget_id = 1) and ((permtype = list) and ((unit = user and unitid = 1) or (unit = group and unitid in 1,2) or (unit = tier and unitid in 1) or (unit = any))) order by orderno asc limit 1
if nil retry next permtree.id

get perm:user:1 tree:1:list true



## groupテーブル

* groups

| id   | ...  | parent_group_id |
| ---- | ---- | ----            |
| 1    | .... | -1              |
| 2    | .... | 1               |
| 3    | .... | 1               |

* user_group

| id   | user_id | group_id |
| ---- | ----    | ----     |
| 1    | 1       | 2        |
| 2    | 1       | 3        |

select group_id from user_group where user_id = 1
get groups:user:1 2,3

with recursive t_group_list
  select id, parent_group_id from groups where id in 2,3
  union all
  select groups.id, groups.parent_group_id from t_group_list
    join group t_group_list.parent_id = groups.id
select id from t_group_list;

get subgroups:user:1 2,3,1

## template

* group_permission_template

| id   | group_id | permtype | 
| ---- | ----    | ----     |
| 1    | 1       | list     |
| 2    | 1       | get      |
| 3    | 1       | update   |



## role(tier)

* tiers

| id   | tier_name |
| ---- | ----      |
| 1    | owner     |
| 2    | admin     |


* tier_permission_template

| id   | tier_id | permtype | 
| ---- | ----    | ----     |
| 1    | 1       | list     |
| 2    | 1       | get      |
| 3    | 1       | update   |

* user_tier

| id   | tier_id | user_id | 
| ---- | ----    | ----    |
| 1    | 1       | 1       |


* group_tier

| id   | tier_id | group_id | 
| ---- | ----    | ----     |
| 1    | 1       | 1        |
