function getConsentHTML() {
    return `
        <div class="content-box" style="position: relative;">
            <div class="lab-logo">${LAB_LOGO}</div>

            <p style="text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 4px;">Welcome!</p>
            <p style="text-align: center; color: #777; font-size: 15px; margin-top: 0; margin-bottom: 24px;">${LAB_NAME} &nbsp;·&nbsp; ${INSTITUTION}</p>

            <hr class="consent-hr">

            <p>Dear Participant,</p>

            <p>Thank you for your interest in our study! You are being invited to participate in a research study conducted by researchers at the ${LAB_NAME} at ${INSTITUTION}. The purpose of this study is to better understand how we think about everyday questions and situations.</p>

            <p>In this study, you will see a series of short descriptions of everyday questions and use sliders to make estimates about each one. We expect this study to take approximately <strong>${ESTIMATED_DURATION_MIN} minutes</strong>, and you will receive <strong>$${PAYMENT.toFixed(2)}</strong> for your participation.</p>

            <p>Your participation in this study is completely voluntary, and you may withdraw at any time without penalty. You must be at least 18 years old to participate. There are no known risks associated with this research. Your responses will be kept anonymous; no personally identifying information will be collected or associated with your data.</p>

            <p>If you have any questions about this study, please contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. If you have questions about your rights as a research participant, please contact the Stanford University Institutional Review Board.</p>

            <hr class="consent-hr">

            <p style="font-size: 15px; color: #555;">By clicking the button below, I confirm that I am 18 years of age or older, that I have read and understood the information above, and that I agree to participate in this study.</p>

            <div style="text-align: center; margin-top: 8px;">
                <button id="consent-btn" class="jspsych-btn">I Agree — Begin Study</button>
            </div>
        </div>
    `;
}
