module aivoting::vote_event;

use iota::object::{Self as object, UID};
use iota::transfer::public_share_object;
use iota::tx_context::{Self as tx_context, TxContext};
use std::vector;

/// 單一候選人：
/// - id: 在這場投票中的編號（0,1,2,...）
/// - name: 候選人名稱（UTF-8 bytes）
public struct Candidate has store {
    id: u64,
    name: vector<u8>,
}

/// 一張選票（vote，存 inside VoteEvent）：
/// - encrypted_vote: 加密後的投票內容（c = E(PK, v)）
/// - sign: 對投票者公鑰的 RSA 簽名（目前只存，不驗證）
/// 注意：這裡沒有 key，這些 Vote 不會是獨立物件，只是 VoteEvent 裡的資料。
public struct Vote has store {
    encrypted_vote: vector<u8>,
    sign: vector<u8>,
}

/// 投票事件（vote_event）：
/// - admin: 管理者地址
/// - event_name: 投票主題名稱
/// - event_desc: 投票主題描述
/// - candidates: 這場投票所有候選人
/// - votes: 所有選票都直接塞在這裡
public struct VoteEvent has key, store {
    id: UID,
    admin: address,
    event_name: vector<u8>,
    event_desc: vector<u8>,
    candidates: vector<Candidate>,
    votes: vector<Vote>,
}

/// 建立一個新的 vote_event 物件並公開分享：
/// - admin = 發起這筆交易的人
/// - 初始時沒有任何候選人 / 沒有任何票
public entry fun create_vote_event(ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    let ve = VoteEvent {
        id: object::new(ctx),
        admin: sender,
        event_name: vector::empty<u8>(),
        event_desc: vector::empty<u8>(),
        candidates: vector::empty<Candidate>(),
        votes: vector::empty<Vote>(),
    };

    public_share_object(ve);
}

/// 由 admin 設定投票主題資訊：
/// - 只有 admin 可以呼叫成功
public entry fun add_vote_info(
    ve: &mut VoteEvent,
    name: vector<u8>,
    desc: vector<u8>,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(sender == ve.admin, 900);

    ve.event_name = name;
    ve.event_desc = desc;
}

/// 由 admin 對 vote_event 新增一個候選人：
/// - 只有 admin 可以呼叫成功
/// - 自動幫你用目前長度當作 id（0,1,2,...）
public entry fun add_candidate(
    ve: &mut VoteEvent,
    name: vector<u8>,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    assert!(sender == ve.admin, 900);

    let id = vector::length(&ve.candidates);
    let candidate = Candidate { id, name };

    vector::push_back(&mut ve.candidates, candidate);
}

/// 對某個 vote_event 投票（簡單版）：
/// - 直接把 Vote 塞進 VoteEvent.votes 裡
/// - 因為要修改 VoteEvent，所以這裡是 &mut VoteEvent
/// - 多人同時投票時會搶同一顆 shared object，平行化能力較差
public entry fun vote(
    ve: &mut VoteEvent,
    encrypted_vote: vector<u8>,
    sign: vector<u8>,
    _ctx: &mut TxContext,
) {
    // 這裡原本驗證 candidate_id < n，但現在是加密內容，無法在鏈上直接驗證內容有效性（除非用 ZK，目前先略過）
    // let n = vector::length(&ve.candidates);
    
    let v = Vote {
        encrypted_vote,
        sign,
    };

    vector::push_back(&mut ve.votes, v);
}