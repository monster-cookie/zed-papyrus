ScriptName ZedPapyrus:BasicFallout4 extends Quest

{Original basic fixture for Fallout 4 Papyrus syntax.}

Actor Property PlayerRef Auto Mandatory
Int Property MaximumValue = 10 Auto

Event OnInit()
    Debug.Trace("Fallout 4 fixture initialized")
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
