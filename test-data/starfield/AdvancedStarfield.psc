ScriptName ZedPapyrus:AdvancedStarfield extends ScriptObject Const

{Original coverage fixture for modern Starfield Papyrus constructs.}

Import Utility

Struct WorkItem
    String Name
    Int Count = 0
    Bool Enabled = True
EndStruct

CustomEvent OnWorkQueued

Guard DataGuard
Guard LogicGuard ProtectsFunctionLogic

Int GuardedCount RequiresGuard(DataGuard)
WorkItem[] Property PendingWork Auto Mandatory RequiresGuard(DataGuard)
ActorValue:ActorValueInfo Property CurrentInfo Auto
Int Property GuardedProperty RequiresGuard (DataGuard) Auto Conditional

Group Configuration CollapsedOnRef
    Bool Property EnableTracing = True Auto
    String Property DisplayName Auto
EndGroup

Int Function GetVersion() Global Native

Function UpdateCount(Int aiAmount) RequiresGuard(LogicGuard)
    LockGuard(DataGuard)
        GuardedCount += aiAmount
    EndLockGuard
EndFunction

Bool Function TryQueue(WorkItem akWork, \
    Int aiMinimumCount = 1)
    Actor[] queuedActors = new Actor[4]

    TryLockGuard DataGuard
        If akWork.Count >= aiMinimumCount && akWork.Enabled
            PendingWork.Add(akWork)
            SendCustomEvent("OnWorkQueued")
            Return True
        EndIf
    Else
        Debug.Trace("Data guard is already locked; skipping work")
    EndTryLockGuard

    Return False
EndFunction

Actor Function ResolveActor(ObjectReference akReference)
    Return akReference as Actor
EndFunction

Auto State Waiting
    Event OnBeginState(String asOldState)
        Debug.Trace("Waiting")
    EndEvent
EndState

Event Actor.OnDeath(ObjectReference akSender, Actor akKiller)
    Debug.Trace("Remote death event")
EndEvent
