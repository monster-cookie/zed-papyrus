ScriptName ZedPapyrusBasicSkyrim extends Quest

{; Original basic fixture for Skyrim Anniversary Edition Papyrus syntax.}

Actor Property PlayerRef Auto
Int Property MaximumValue = 10 Auto

Event OnInit()
    Debug.Trace("Skyrim fixture initialized")
EndEvent

Int Function ClampValue(Int aiValue, Int aiMinimum = 0)
    If aiValue < aiMinimum
        Return aiMinimum
    ElseIf aiValue > MaximumValue
        Return MaximumValue
    Else
        Return aiValue
    EndIf
EndFunction
