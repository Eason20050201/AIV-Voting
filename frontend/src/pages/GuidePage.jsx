import React from "react";
import "./GuidePage.css";

const GuidePage = () => {
    return (
        <div className="guide-page-container">
            <div className="guide-content">
                <h1 className="guide-title">Platform Guide</h1>

                <div className="guide-timeline">
                    {/* Section 1 */}
                    <section className="guide-section">
                        <div className="section-header">
                            <div className="section-number">1</div>
                            <h2 className="section-title">Create Account</h2>
                        </div>

                        <p className="guide-text">
                            In our system, you must select your identity upon creation:{" "}
                            <strong style={{ color: "var(--primary-color)" }}>Election Administrator</strong> or{" "}
                            <strong style={{ color: "var(--secondary-color)" }}>Voter</strong>.
                        </p>

                        <div className="step-card">
                            <h3>1.1 Click "Login" in the top left corner</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/1.1.png`}
                                    alt="Click Login"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>1.2 Select "Sign up"</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/1.2.png`}
                                    alt="Select Sign up"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>1.3 Create account credentials and select your identity</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/1.3.png`}
                                    alt="Create Account"
                                    className="guide-image"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="guide-section">
                        <div className="section-header">
                            <div className="section-number">2</div>
                            <h2 className="section-title">Connect Wallet</h2>
                        </div>

                        <div className="step-card">
                            <h3>2.1 Click on the avatar in the top right corner {"->"} Profile</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/2.1.png`}
                                    alt="Profile Menu"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>
                                2.2 Click "Connect Wallet"
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
                                Note: Please install the IOTA Wallet Chrome extension and create an IOTA wallet beforehand.
                            </p>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/2.2.png`}
                                    alt="Connect Wallet"
                                    className="guide-image"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="guide-section">
                        <div className="section-header">
                            <div className="section-number">3</div>
                            <h2 className="section-title">Create Voting</h2>
                        </div>

                        <p className="guide-text">
                            The following steps vary depending on your identity. If you are a{" "}
                            <strong>voter</strong>, please skip to <strong>Voting</strong>.
                        </p>

                        <div className="step-card">
                            <h3>3.1 Click "Create Voting" in the top right corner</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/3.1.png`}
                                    alt="Create Voting Button"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>
                                3.2 Fill in the details, click "Create", and sign to confirm the
                                transaction on-chain
                            </h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/3.2.png`}
                                    alt="Fill Voting Details"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>3.3 Click "My Created Votings" to view your created events</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/3.3.png`}
                                    alt="My Created Votings"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>3.4 Click "Manage" to manage the event</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/3.4.png`}
                                    alt="Manage Voting"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>
                                3.5 In "Manage", you can approve verification requests from voters
                            </h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/3.5.png`}
                                    alt="Approve Verification"
                                    className="guide-image"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="guide-section">
                        <div className="section-header">
                            <div className="section-number">4</div>
                            <h2 className="section-title">Voting</h2>
                        </div>

                        <p className="guide-text">
                            If you are an <strong>Election Administrator</strong>, you cannot vote.
                        </p>

                        <div className="step-card">
                            <h3>
                                4.1 Select the voting event you want to participate in
                            </h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/4.1.png`}
                                    alt="Select Event"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>4.2 Click "Verify Identity"</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/4.2.png`}
                                    alt="Click Verify"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>4.3 Enter your verification details, submit, and wait for verification</h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/4.3.png`}
                                    alt="Submit Verification"
                                    className="guide-image"
                                />
                            </div>
                        </div>

                        <div className="step-card">
                            <h3>
                                4.4 Once verified, you can cast your vote, sign to confirm
                                on-chain, and complete voting
                            </h3>
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/4.4.png`}
                                    alt="Cast Vote"
                                    className="guide-image"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="guide-section">
                        <div className="section-header">
                            <div className="section-number">5</div>
                            <h2 className="section-title">View Results</h2>
                        </div>

                        <p className="guide-text">
                            Everyone can click on ended voting events to view the results. You
                            can also use the On-Chain ID at the bottom of the image to verify
                            the results on-chain.
                        </p>

                        <div className="step-card">
                            <div className="image-wrapper">
                                <img
                                    src={`${import.meta.env.BASE_URL}images/guide/5.1.png`}
                                    alt="View Results"
                                    className="guide-image"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default GuidePage;
