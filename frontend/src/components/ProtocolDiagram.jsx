import React from "react";

const ProtocolDiagram = () => {
    // Configuration
    const width = 950;
    const height = 900;

    // X Coordinates (Spread out to match reference)
    // Step Titles at x=20
    const xVoter = 380;      // Move Voter right to allow text on left
    const xBlockchain = 650; // Middle
    const xEA = 900;         // Right side

    // Y Coordinates for steps
    const yStart = 60;
    const steps = {
        init: 100,
        register: 220,     // Start of Register block
        registerResponse: 320,
        voting: 420,
        tally: 540,        // Moved down
        verify: 680,       // Moved down
        verifyResponse: 820 // Moved down
    };

    const theme = {
        lineColor: "rgba(255, 255, 255, 0.2)",
        textColor: "#e2e8f0",
        textDim: "#94a3b8",
        accentVoter: "#c4c4f7ff", // Indigo
        accentBC: "#7c8ffbff",    // Purple
        accentEA: "#7426e9ff",    // Fuchsia
        arrowColor: "#cbd5e1"
    };

    // Helper for arrow marker
    const ArrowHead = () => (
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={theme.arrowColor} />
        </marker>
    );

    return (
        <div style={{ width: "100%", overflowX: "auto", background: "rgba(15, 23, 42, 0.6)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 0" }}>
            <svg viewBox={`0 0 ${width} ${height} `} style={{ minWidth: "950px", fontFamily: "Inter, sans-serif" }}>
                <defs>
                    <ArrowHead />
                </defs>

                {/* --- Headers --- */}
                <text x={xVoter} y="40" textAnchor="middle" fill={theme.accentVoter} fontWeight="bold" fontSize="18">Voter</text>
                <text x={xBlockchain} y="40" textAnchor="middle" fill={theme.accentBC} fontWeight="bold" fontSize="18">Blockchain</text>
                <text x={xEA} y="40" textAnchor="middle" fill={theme.accentEA} fontWeight="bold" fontSize="18">EA</text>

                {/* --- Lifelines --- */}
                <line x1={xVoter} y1={yStart} x2={xVoter} y2={height - 20} stroke={theme.lineColor} strokeWidth="2" />
                <line x1={xBlockchain} y1={yStart} x2={xBlockchain} y2={height - 20} stroke={theme.lineColor} strokeWidth="2" />
                <line x1={xEA} y1={yStart} x2={xEA} y2={height - 20} stroke={theme.lineColor} strokeWidth="2" />

                {/* Arrow definition wrapper for easy usage */}
                {/* We use raw lines and markers for maximum control */}


                {/* ==================== 1. Initialization ==================== */}
                <text x="20" y={steps.init - 10} fill={theme.textColor} fontWeight="bold" fontSize="18">I. Initialization</text>

                {/* Voter Text: Left of Line */}
                <text x={xVoter - 15} y={steps.init - 10} textAnchor="end" fill={theme.textColor} fontSize="14">Generate (pkₐ, skₐ)</text>
                <text x={xVoter - 15} y={steps.init + 15} textAnchor="end" fill={theme.textColor} fontSize="14">addr = pkₐ</text>
                <circle cx={xVoter} cy={steps.init} r="4" fill={theme.accentVoter} />

                {/* EA Text: Left of Line (between BC and EA) */}
                <text x={xEA - 15} y={steps.init} textAnchor="end" fill={theme.textColor} fontSize="14">Generate (PK, SK)</text>
                <circle cx={xEA} cy={steps.init} r="4" fill={theme.accentEA} />


                {/* ==================== 2. Register ==================== */}
                <text x="20" y={steps.register - 10} fill={theme.textColor} fontWeight="bold" fontSize="18">II. Register</text>

                {/* Voter Prep */}
                <text x={xVoter - 15} y={steps.register - 10} textAnchor="end" fill={theme.textColor} fontSize="14">addr' = Blind(addr)</text>

                {/* Arrow: Voter -> EA */}
                {/* Arrow line */}
                <line x1={xVoter} y1={steps.register - 14} x2={xEA - 10} y2={steps.register - 14} stroke={theme.arrowColor} strokeWidth="2" markerEnd="url(#arrowhead)" />
                {/* Arrow Label */}
                <text x={xVoter + 40} y={steps.register - 22} textAnchor="middle" fill={theme.arrowColor} fontSize="13">[addr', Q]</text>

                {/* EA Processing */}
                <text x={xEA - 15} y={steps.register + 46} textAnchor="end" fill={theme.textColor} fontSize="14">if(Q) : S' = Sign(addr')</text>

                {/* Arrow: EA -> Voter */}
                <line x1={xEA} y1={steps.registerResponse} x2={xVoter + 10} y2={steps.registerResponse} stroke={theme.arrowColor} strokeWidth="2" markerEnd="url(#arrowhead)" />
                <text x={xEA - 10} y={steps.registerResponse - 8} textAnchor="end" fill={theme.arrowColor} fontSize="13">[S']</text>

                {/* Voter Unblind (after receiving) */}
                <text x={xVoter - 15} y={steps.registerResponse + 5} textAnchor="end" fill={theme.textColor} fontSize="14">S = Unblind(S')</text>


                {/* ==================== 3. Voting ==================== */}
                <text x="20" y={steps.voting + 25} fill={theme.textColor} fontWeight="bold" fontSize="18">III. Voting</text>

                {/* Voter Prep */}
                <text x={xVoter - 15} y={steps.voting + 15} textAnchor="end" fill={theme.textColor} fontSize="14">c = E(PK, v)</text>
                <text x={xVoter - 15} y={steps.voting + 40} textAnchor="end" fill={theme.textColor} fontSize="14">V = (c, S)</text>

                {/* Arrow: Voter -> Blockchain */}
                <line x1={xVoter} y1={steps.voting + 20} x2={xBlockchain - 10} y2={steps.voting + 20} stroke={theme.arrowColor} strokeWidth="2" markerEnd="url(#arrowhead)" />
                <text x={xVoter + 11} y={steps.voting + 12} textAnchor="start" fill={theme.arrowColor} fontSize="13">[V]</text>


                {/* ==================== 4. Tally ==================== */}
                <text x="20" y={steps.tally + 20} fill={theme.textColor} fontWeight="bold" fontSize="18">IV. Tally</text>

                {/* Arrow: Blockchain -> EA */}
                <line x1={xBlockchain} y1={steps.tally + 20} x2={xEA - 10} y2={steps.tally + 20} stroke={theme.arrowColor} strokeWidth="2" markerEnd="url(#arrowhead)" />

                {/* EA Process text */}
                <text x={xEA - 15} y={steps.tally + 10} textAnchor="end" fill={theme.textColor} fontSize="14">if(V.S) : add V to R</text>


                {/* ==================== 5. Verification ==================== */}
                <text x="20" y={steps.verify} fill={theme.textColor} fontWeight="bold" fontSize="18">V. Verification</text>

                {/* Voter Text */}
                <text x={xVoter - 15} y={steps.verify} textAnchor="end" fill={theme.textColor} fontSize="14">Check R on Blockchain</text>

                {/* Arrow: EA -> Blockchain */}
                <line x1={xEA} y1={steps.verify - 3} x2={xBlockchain + 10} y2={steps.verify - 3} stroke={theme.arrowColor} strokeWidth="2" markerEnd="url(#arrowhead)" />
                <text x={xEA - 10} y={steps.verify - 8} textAnchor="end" fill={theme.arrowColor} fontSize="13">[R, SK]</text>

            </svg>
        </div>
    );
};

export default ProtocolDiagram;
