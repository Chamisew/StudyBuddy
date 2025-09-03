# Level Completion Test Guide

## What Should Happen When You Click "Finish" in Level 1:

### ✅ **Points Addition**
- **Expected**: +100 points added to your total
- **Where to Check**: 
  - Success modal shows "+100 Points"
  - Profile page shows updated total points
  - Console shows: "✅ Level 1 completed! Adding 100 points"

### ✅ **Level 2 Unlocking**
- **Expected**: Level 2 becomes available to play
- **Where to Check**:
  - Escape room main screen shows Level 2 as "available" (not locked)
  - Console shows: "🎯 Progress updated: Level 2 unlocked"
  - You can tap and enter Level 2

### ✅ **Badge Award**
- **Expected**: "Lab Master" badge is awarded
- **Where to Check**:
  - Success modal shows "Lab Master Badge"
  - Profile page shows badge in escape room section

### ✅ **Profile Page Updates**
- **Expected**: All progress reflects immediately
- **Where to Check**:
  - Escape Room section shows 1/5 levels complete
  - Progress bar updates to 20%
  - Total points increase by 100
  - Badge appears in badges list

## Step-by-Step Test:

1. **Start Level 1**: Go to Escape Room → Play Level 1 (Science Lab)
2. **Complete All Puzzles**: Answer all questions correctly (need 70%+ to pass)
3. **Click "Finish"**: Tap the finish button
4. **Check Success Modal**: 
   - Should show "+100 Points"
   - Should show "Lab Master Badge"
   - Should show "Level 2 is now unlocked!"
5. **Return to Main Screen**: Click "Back to Levels"
6. **Verify Level 2**: Should be clickable (not grayed out)
7. **Check Profile**: Go to Profile → Escape Room section should show updated stats

## Debug Information:

The console will show these messages for successful completion:
```
✅ Level 1 completed! Adding 100 points. Unlocking level 2
🎯 Progress updated: Level 2 unlocked, 100 points added
```

## Troubleshooting:

- **Points not showing**: Check Firebase connection and user authentication
- **Level 2 still locked**: Refresh the escape room screen (should auto-refresh)
- **Profile not updating**: Profile should auto-refresh when you visit it
- **Success modal not appearing**: Check console for error messages

## Expected Results Summary:

| Item | Before Level 1 | After Level 1 |
|------|----------------|---------------|
| Total Points | 0 | 100 |
| Completed Levels | 0/5 | 1/5 |
| Current Level | 1 | 2 |
| Badges | None | Lab Master |
| Level 2 Status | Locked | Available |
| Progress % | 0% | 20% |