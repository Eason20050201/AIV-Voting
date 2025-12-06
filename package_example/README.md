## 步驟教學

1. 創建package:

    iota move new <name> 

2. 編譯:

    iota move build 

3. 推到鏈上

    iota client publish (預算上限:--gas-budget 100000000) (測手續費: --dry-run) 

4. 要記錄的重點！！ 

Transaction Digest: 2XtzMRLy1e85gvbf2RXs14dVkPq5G6FQkDQ8EoCu5d6p
G4TeTPTbCpEChvWmFHFXkbKQncvLzv9vsc3hSZqPTbsy
PackageID: 0xc84fe0223206e036d9c2751ab90453aa043d1ddf75d4eeb399381920e27e952f 
0xe8652a475b45611dd560495b4cce2c324d508dbe61b403aca4ed9b66f811537c

5. 創建投票

    iota client call \
    --package <package_id> \
    --module vote_event \
    --function create_and_share 

6. 取的物件ID

在交易 effects 中找到型別 aivoting::vote_event::Vote 的 shared object，把它記為 <VOTE_OBJECT_ID>

7. 投票

    iota client call \
    --package <package_id> \
    --module vote_event \
    --function add_candidate \
    --args <VOTE_OBJECT_ID> "<V>" \
    --gas-budget 30000000
