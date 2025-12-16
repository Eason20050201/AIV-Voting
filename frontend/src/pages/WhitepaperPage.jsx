import React from "react";
import "./WhitepaperPage.css";
import ProtocolDiagram from "../components/ProtocolDiagram";

const WhitepaperPage = () => {
    return (
        <div className="whitepaper-container">
            <h1 className="whitepaper-title">Whitepaper</h1>

            {/* Abstract */}
            <section className="whitepaper-section">
                <h2 className="section-title">Abstract</h2>
                <div className="abstract-text">
                    <p>
                        Electronic voting has always been a widely discussed topic. Its greatest challenge lies in maintaining <strong>anonymity</strong> while ensuring <strong>verifiability</strong>.
                        Our AIVoting system cleverly utilizes the isolation between <strong>blockchain</strong> public key addresses and personal identity to achieve anonymity, and employs <strong>blind signature</strong> technology to sign the blinded public key addresses of eligible voters to achieve verifiability.
                    </p>
                    <p>
                        In AIVoting, <strong>"A"</strong> stands for <strong>Anonymous</strong>, and <strong>"IV"</strong> stands for <strong>Individually Verifiable</strong>.
                        Compared to traditional paper voting, all voters can verify if their votes were recorded and counted correctly after the election, while remaining completely anonymous.
                    </p>
                </div>
            </section>

            {/* Protocol */}
            <section className="whitepaper-section">
                <h2 className="section-title">Our Protocol</h2>
                <ProtocolDiagram />

                <div className="protocol-description">
                    {/* 1. Initialization */}
                    <div className="protocol-desc-step">
                        <div className="protocol-desc-title">I. Initialization Phase</div>
                        <span className="protocol-role">Voter:</span>
                        Generates a key pair <span className="protocol-math">(pkₐ, skₐ)</span> on the blockchain.

                        <span className="protocol-role">Election Administrator (EA):</span>
                        Generates an asymmetric key pair <span className="protocol-math">(PK, SK)</span>. This is intended to maintain fairness during the election, ensuring voters cannot see the contents of other votes before the election ends. The private key will be published after the election.
                    </div>

                    {/* 2. Registration */}
                    <div className="protocol-desc-step">
                        <div className="protocol-desc-title">II. Registration Phase</div>
                        <span className="protocol-role">Voter:</span>
                        Blinds their blockchain public key address <span className="protocol-math">addr</span> into <span className="protocol-math">addr'</span> and sends their verification data <span className="protocol-math">Q</span> (the form of <span className="protocol-math">Q</span> can be decided by the EA) to the EA.

                        <span className="protocol-role">Election Administrator (EA):</span>
                        Checks the received voter application data <span className="protocol-math">Q</span>. If eligible, authorizes and signs it:
                        <span className="protocol-block-math">S' = Sign(addr')</span>
                        and sends <span className="protocol-math">S'</span> back to the voter.

                        <span className="protocol-role">Voter:</span>
                        Upon successful application, unblinds <span className="protocol-math">S'</span>:
                        <span className="protocol-block-math">S = Unblind(S')</span>
                        obtaining <span className="protocol-math">S</span> as the credential for subsequent authentication by the EA.
                    </div>

                    {/* 3. Voting */}
                    <div className="protocol-desc-step">
                        <div className="protocol-desc-title">III. Voting Phase</div>
                        <span className="protocol-role">Voter:</span>
                        Encrypts their vote content <span className="protocol-math">v</span>:
                        <span className="protocol-block-math">c = E(PK, v)</span>
                        and constructs the ballot:
                        <span className="protocol-block-math">V = (c, S)</span>
                        Finally, places <span className="protocol-math">V</span> on the blockchain to complete voting.
                    </div>

                    {/* 4. Tally */}
                    <div className="protocol-desc-step">
                        <div className="protocol-desc-title">IV. Tallying Phase (Results)</div>
                        <span className="protocol-role">Election Administrator (EA):</span>
                        After the voting period ends, collects all <span className="protocol-math">V</span> from the blockchain. If <span className="protocol-math">S</span> in <span className="protocol-math">V</span> is valid, adds <span className="protocol-math">V</span> to the election result set <span className="protocol-math">R</span>.
                    </div>

                    {/* 5. Verification */}
                    <div className="protocol-desc-step">
                        <div className="protocol-desc-title">V. Verification Phase</div>
                        <span className="protocol-role">Election Administrator (EA):</span>
                        Publishes the result <span className="protocol-math">R</span> on the blockchain and reveals the private key <span className="protocol-math">SK</span> to allow everyone to decrypt and verify.

                        <span className="protocol-role">Voter:</span>
                        Can use <span className="protocol-math">SK</span> to check if every <span className="protocol-math">V</span> (including their own and others) is correctly included in <span className="protocol-math">R</span> by the EA.
                    </div>
                </div>
            </section>

            {/* Security Analysis */}
            <section className="whitepaper-section">
                <h2 className="section-title">Security Analysis</h2>
                <div className="security-grid">
                    <div className="security-card">
                        <h3>Anonymity</h3>
                        <p>
                            We use blind signatures so the verifier (EA) signs the voter's address without knowing the actual public key, ensuring identity isolation.
                        </p>
                    </div>
                    <div className="security-card">
                        <h3>Eligibility</h3>
                        <p>
                            Only voters with a valid signature from the EA can participate. We verify the correspondence between the address and S during tallying.
                        </p>
                    </div>
                    <div className="security-card">
                        <h3>Fairness</h3>
                        <p>
                            Votes are encrypted with an asymmetric key during the election, preventing voters from seeing others' votes before the election ends.
                        </p>
                    </div>
                    <div className="security-card">
                        <h3>One Person, One Vote</h3>
                        <p>
                            The EA signs only one key per verified person. The blockchain ensures only the last valid vote from a registered address is counted.
                        </p>
                    </div>
                    <div className="security-card">
                        <h3>Public Verifiability</h3>
                        <p>
                            Anyone can view the blockchain to see the voting results and verify if the calculations are correct using the published data.
                        </p>
                    </div>
                    <div className="security-card">
                        <h3>Individual Verifiability</h3>
                        <p>
                            Voters can use the published private key (SK) to verify that their specific encrypted ballot (V) is correctly included in the result set (R).
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WhitepaperPage;
