ScriptName ZedPapyrus:AdvancedFallout4 extends Quest Const

{Original coverage fixture for Fallout 4 Papyrus constructs.}

Import Utility

;//
Function IgnoredFixtureFunction()
    Debug.Trace("Slash-adjacent multiline comment content")
EndFunction
//;

Struct WorkItem
    String Name
    Int Count = 0
    Bool Enabled = True
EndStruct

CustomEvent OnWorkQueued

Group Configuration CollapsedOnRef
    Bool Property EnableTracing = True Auto
    String Property DisplayName Auto
EndGroup

WorkItem[] Property PendingWork Auto Mandatory
ExampleLibrary:Entry Property ExternalEntry Auto

Int Function GetFixtureVersion() Global Native

Bool Function QueueWork(WorkItem akWork, ObjectReference akReference)
    WorkItem[] localWork = new WorkItem[2]
    Actor resolvedActor = akReference as Actor

    If resolvedActor Is Actor && akWork.Enabled
        localWork[0] = akWork
        PendingWork.Add(akWork)
        SendCustomEvent("OnWorkQueued")
        Return True
    EndIf

    Return False
EndFunction

Auto State Waiting
    Event OnBeginState(String asOldState)
        Debug.Trace("Waiting")
    EndEvent
EndState

Event Actor.OnDeath(ObjectReference akSender, Actor akKiller)
    Debug.Trace("Remote death event")
EndEvent
