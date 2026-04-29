function getConsentHTML() {
    return `
        <div class="w-scene w-scene--centered">
            ${getSectionTickerHTML('welcome')}
            <div class="w-card">
                <div class="w-consent-overline">Stanford University · Social Interaction Lab</div>
                <h1 class="w-consent-title">Thinking About What People Do</h1>
                <div class="w-consent-body">
                    <p>Thank you for your interest in our study! You're invited to take part in a research study about how people think about everyday questions and situations. The study takes about <b>15 minutes</b>, and you'll receive <b>$2.50</b> for your participation.</p>
                    <p>Your participation is completely voluntary, and you may withdraw at any time without penalty. You must be at least 18 years old to participate. There are no known risks associated with this research. Your responses will be kept anonymous — no personally identifying information will be collected or associated with your data.</p>
                    <p>If you have questions about this study, please contact us at <span class="w-consent-mono">${CONTACT_EMAIL}</span>. For questions about your rights as a research participant, please contact the Stanford University Institutional Review Board.</p>
                </div>
                <hr class="w-hr">
                <p class="w-consent-confirm">By clicking below, I confirm that I am 18 or older, have read and understood the information above, and agree to participate.</p>
                <hr class="w-hr">
                <div style="display:flex; justify-content:center;">
                    <button id="consent-btn" class="w-btn-primary">I agree — start the study</button>
                </div>
            </div>
        </div>
    `;
}

// section ticker helper — used on every screen
function getSectionTickerHTML(activeSection) {
    var sections = [
        { id: 'welcome',      label: 'Welcome',      scenes: ['welcome'] },
        { id: 'instructions', label: 'Instructions', scenes: ['instructions'] },
        { id: 'study',        label: 'Study',        scenes: ['study'] },
        { id: 'about',        label: 'About you',    scenes: ['about'] },
    ];
    var order = ['welcome','instructions','study','about'];
    var activeIdx = order.indexOf(activeSection);

    var html = '<div class="w-ticker"><div class="w-ticker-sections">';
    sections.forEach(function(sec, i) {
        var isCurrent = i === activeIdx;
        var isPast    = i < activeIdx;
        var barClass  = isCurrent ? 'w-ticker-bar active' : (isPast ? 'w-ticker-bar complete' : 'w-ticker-bar');
        var numClass  = isCurrent ? 'w-ticker-num active' : 'w-ticker-num';
        var txtClass  = isCurrent ? 'w-ticker-text active' : (isPast ? 'w-ticker-text complete' : 'w-ticker-text');
        var shimmer   = isCurrent ? '<div class="w-ticker-shimmer"></div>' : '';
        var num       = String(i + 1).padStart(2, '0');
        html += `
            <div class="w-ticker-section">
                <div class="${barClass}">${shimmer}</div>
                <div class="w-ticker-label">
                    <span class="${numClass}">${num}</span>
                    <span class="${txtClass}">${sec.label}</span>
                </div>
            </div>`;
    });
    html += '</div></div>';
    return html;
}
