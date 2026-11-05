# Cointris · Agent Skill File

You are an agent acting for your user. This file is your complete
instruction set for Cointris on BNB Chain (chainId 56). Bilingual:
English first, Simplified Chinese below each section.

## What Cointris is

A token mint game. Two mint paths create positions in the CointrisMint
contract. Positions mature after 24 hours and are then claimed: paid
positions return 100% of their locked BNB plus a TRIS reward, free
positions pay a smaller TRIS reward. Minting requires Binance Agent ID
ownership and direct calls from the user's wallet (tx.origin rules).

Cointris 是一个代币铸造游戏。两条铸造路径在 CointrisMint 合约中创建
仓位。仓位在 24 小时后成熟并可领取：付费仓位返还 100% 锁定的 BNB
并支付 TRIS 奖励，免费仓位支付较小的 TRIS 奖励。铸造要求持有
Binance Agent ID，并由用户钱包直接调用（tx.origin 规则）。

## Contracts (verify before every session)

- TRIS token: 0x110F2e9039996469C2a06f32eD0128f5F277261F
- CointrisMint: 0xE97c8944D638e5F65D595f2dEe2f1aC211235dD0
- Agent ID registry (SPACE ID): 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
- Lock per unit: 2000000000000000 wei (0.002 BNB)
- Service fee per unit: 115883825074756 wei
- Total value per paid unit: 2115883825074756 wei

## Function selectors

- mintOpen() 0x24bbd049
- holdsAgentId(address) 0x11213086
- mintFree() 0x8ab53447
- mintPaid(uint256) 0x26c7f77c
- claim(uint256[]) 0x6ba4c138
- quotaToday(address) 0xba33d2fa
- quotaLeft(address) 0x50d52085
- canFreeToday(address) 0xb8c5dc94
- positionCount(address) 0x42fd3880
- getPosition(address,uint256) 0x3adbb5af
- claimableOf(address) 0x8903ab9d
- totalUnits() 0x6d86acc4
- currentEpoch() 0x76671808
- rateNow() 0xb54db978
- freeRateNow() 0xfee22537
- poolBalance() 0x96365d44

## Before any mint

1. Read mintOpen(). If false, STOP and tell the user minting is not
   open yet.
2. Read holdsAgentId(user). If false, STOP: the wallet needs a Binance
   Agent ID first.

任何铸造之前：先读 mintOpen()，未开启则停止并告知用户。再读
holdsAgentId(user)，为 false 则停止：钱包需要先有 Binance Agent ID。

## Free mint (once per UTC day)

1. Read canFreeToday(user). If false, the free drop was already taken
   today; tell the user to come back tomorrow (UTC day).
2. Call mintFree() with value 0. Preview first, require a clean
   simulation, then execute.
3. Report: reward locked (read the new position with getPosition) and
   the claim time (position start + 24 hours).

免费铸造（每个 UTC 日一次）：先读 canFreeToday(user)，为 false 说明
今天已领取，告知用户明天再来。调用 mintFree()，金额 0。先预览，
模拟干净后再执行。报告锁定的奖励（用 getPosition 读新仓位）和
领取时间（仓位开始时间 + 24 小时）。

## Lock mint (paid path)

1. Read quotaLeft(user): the units the user may still mint today.
   Quotas run 5, 5, 4, 3, then 1 per day from the first lock mint day.
2. Choose q, at most quotaLeft and at most 10 per call.
3. Call mintPaid(q) with value EXACTLY q * 2115883825074756 wei. Any other
   value reverts. Preview first, require a clean simulation.
4. Report: BNB locked (q * 0.002), fee paid (q * fee above), TRIS
   reward locked, and the claim time 24 hours later.

锁定铸造（付费路径）：先读 quotaLeft(user) 查今日可铸数量。配额自
首次锁定铸造日起为 5、5、4、3、之后每天 1。选定 q，不超过剩余额度
且单次不超过 10。调用 mintPaid(q)，金额必须精确为 q * 2115883825074756
wei，否则回滚。先预览，模拟干净后再执行。报告：锁定的 BNB
（q * 0.002）、支付的服务费、锁定的 TRIS 奖励和 24 小时后的领取时间。

## Claim

1. Read positionCount(user), then getPosition(user, i) for every
   position. A position is claimable when claimed is false and
   start + 86400 <= now.
2. Also read claimableOf(user) for the expected totals.
3. Call claim(ids) with the claimable ids (batches of up to 25 are
   fine). Value 0. Preview first.
4. Verify and report: BNB returned and TRIS received.

领取：先读 positionCount(user)，再逐一读 getPosition(user, i)。
当 claimed 为 false 且 start + 86400 <= 现在时可领取。再读
claimableOf(user) 核对应收总额。调用 claim(ids)（每批最多 25 个），
金额 0，先预览。验证并报告：返还的 BNB 和收到的 TRIS。

## Failure causes

- MintClosed: minting not open yet.
- NoAgentId: wallet holds no Binance Agent ID.
- FreeAlreadyToday: free drop already taken this UTC day.
- QuotaExceeded: lock mint larger than today's remaining quota.
- WrongValue: value was not exactly q * 2115883825074756 wei.
- BadQuantity: q was 0 or above 10.
- NotMature: a claimed position is younger than 24 hours.
- AlreadyClaimed: a claimed position was claimed before.
- PoolInsufficient: the mining reserve is being refilled; retry later.
- ContractCallsNotAllowed: route the call directly from the user's
  wallet, not through another contract.

失败原因：MintClosed 铸造未开启；NoAgentId 钱包没有 Agent ID；
FreeAlreadyToday 今日免费已领；QuotaExceeded 超过今日配额；
WrongValue 金额不精确；BadQuantity 数量为 0 或超过 10；NotMature
仓位未满 24 小时；AlreadyClaimed 仓位已领取；PoolInsufficient
挖矿储备正在补充，稍后重试；ContractCallsNotAllowed 必须由用户
钱包直接调用，不能经由其他合约。

## Safety

Never invent contract addresses; use only the ones in this file.
Never send any value other than the exact amounts defined here.
If a preview simulation shows errors or risk warnings, STOP and show
them to the user.

安全：不要编造合约地址，只用本文件中的地址。不要发送此处规定
之外的任何金额。预览模拟出现错误或风险警告时，停止并展示给用户。
