/*
/// Module: vote_event
module vote_event::vote_event;
*/

module aivoting::vote_event;

// 簡單線上投票：創建後任何人都可對候選項投票，避免重複投票。

use iota::object::{Self as object, UID};
use iota::transfer::public_share_object;
use iota::tx_context::{Self as tx_context, TxContext};
use std::vector;
// no extra string helpers needed

// 投票物件：
// - admin: 管理者地址，可新增候選項與關閉投票
// - open: 是否開放投票
// - candidates: 候選項名稱 -> 票數
// - voted: 已投票地址 -> true（僅用於避免重複投票）
public struct Vote has key, store {
    id: UID,
    admin: address,
    open: bool,
    // 候選項名稱（以 bytes 存），及對應票數
    candidate_names: vector<vector<u8>>,
    candidate_votes: vector<u64>,
}

// 創建投票（分享為可公開存取的物件），可選擇預先加入候選項
// 內部建立投票物件（不可作為 entry fun 回傳）
fun create_internal(ctx: &mut TxContext): Vote {
    let sender = tx_context::sender(ctx);
    Vote {
        id: object::new(ctx),
        admin: sender,
        open: true,
        candidate_names: vector::empty<vector<u8>>(),
        candidate_votes: vector::empty<u64>(),
    }
}

// 將投票物件公開分享以便他人可以在該地址的 module 上投票
// 初始化並立即分享，支援預先加入候選項
// 建立並分享投票物件（供 CLI 調用的 entry function）
public entry fun create_and_share(ctx: &mut TxContext) {
    let v = create_internal(ctx);
    public_share_object(v);
}

// 新增候選項（僅管理者可操作）
public fun add_candidate(v: &mut Vote, name: vector<u8>, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(sender == v.admin, 900);
    if (!contains_candidate_name(&v.candidate_names, &name)) {
        vector::push_back(&mut v.candidate_names, name);
        vector::push_back(&mut v.candidate_votes, 0);
    }
}

// 關閉或開啟投票（僅管理者）
public fun set_open(v: &mut Vote, open: bool, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(sender == v.admin, 901);
    v.open = open;
}

// 進行投票：任何地址都可在 open=true 時投票，且不可重複投票
public fun vote(v: &mut Vote, candidate_name: vector<u8>, ctx: &mut TxContext) {
    assert!(v.open, 902);
    let idx = find_candidate_index(&v.candidate_names, &candidate_name);
    let n = vector::length(&v.candidate_names);
    assert!(idx < n, 904);
    let cur = *vector::borrow_mut(&mut v.candidate_votes, idx);
    *vector::borrow_mut(&mut v.candidate_votes, idx) = cur + 1;
}

// 查詢候選項票數
public fun get_votes(v: &Vote, candidate_name: vector<u8>): u64 {
    let idx = find_candidate_index(&v.candidate_names, &candidate_name);
    let n = vector::length(&v.candidate_names);
    if (idx < n) {
        *vector::borrow(&v.candidate_votes, idx)
    } else { 0 }
}

// 查詢是否開放
public fun is_open(v: &Vote): bool { v.open }

// 查詢是否已投票
// ====== Helpers ======
fun contains_candidate_name(names: &vector<vector<u8>>, name: &vector<u8>): bool {
    let n = vector::length(names);
    let mut i = 0;
    let mut found = false;
    while (i < n) {
        let nm = *vector::borrow(names, i);
        if (nm == *name) { found = true; i = n; } else { i = i + 1; };
    };
    found
}

// 若找到，回傳索引；若找不到，回傳 -1
// 若找到，回傳索引；若找不到，回傳 names 的長度
fun find_candidate_index(names: &vector<vector<u8>>, name: &vector<u8>): u64 {
    let n = vector::length(names);
    let mut i = 0;
    let mut idx = n;
    while (i < n) {
        let nm = *vector::borrow(names, i);
        if (nm == *name) { idx = i; i = n; } else { i = i + 1; };
    };
    idx
}

// For Move coding conventions, see
// https://docs.iota.org/developer/iota-101/move-overview/conventions


