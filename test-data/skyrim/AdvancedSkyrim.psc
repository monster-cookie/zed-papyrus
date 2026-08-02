ScriptName ZedPapyrusAdvancedSkyrim extends Quest Conditional

{Original coverage fixture for Skyrim Anniversary Edition Papyrus constructs.}

Import Utility

Int StoredValue
String[] Property Messages Auto

Int Property CurrentValue
    Int Function Get()
        Return StoredValue
    EndFunction

    Function Set(Int aiValue)
        StoredValue = aiValue
    EndFunction
EndProperty

Int Function GetFixtureVersion() Global Native

Function ProcessActors(Actor[] akActors, \
    Int aiLimit = 4)
    Actor[] selectedActors = new Actor[aiLimit]
    Int index = 0
    Float normalizedLimit = -(1.0 / (aiLimit + 1.0))

    ; Ordinary line-comment coverage.
    ;/ Canonical multiline comment used by every supported dialect. /;
    While index < akActors.Length && index < aiLimit
        Actor currentActor = akActors[index] as Actor
        If currentActor != None
            selectedActors[index] = currentActor
        Else
            Debug.Trace("Skipped actor\n")
        EndIf
        index += 1
    EndWhile
EndFunction

Auto State Waiting
    Event OnBeginState()
        Debug.Trace("Waiting")
    EndEvent
EndState
