ScriptName ZedPapyrus:BasicStarfield extends Quest

{A small original Starfield-oriented script used to exercise basic editing support.}

Actor Property PlayerRef Auto Mandatory
Int Property MaximumValue = 10 Auto

Event OnInit()
    Debug.Trace("Zed Papyrus fixture initialized")
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
