import StaticPageTemplate from '../components/StaticPageTemplate';

const TermsOfServicePage = () => {
    return (
        <StaticPageTemplate
            title="Terms of Service"
            subtitle="Effective Date: December 2024"
        >
            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing and using SpendSync, you accept and agree to be bound by the terms and provision
                of this agreement. If you do not agree to these Terms of Service, please do not use our services.
            </p>

            <h2>2. Use License</h2>
            <p>
                Permission is granted to temporarily download one copy of SpendSync for personal,
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
            <p>Under this license you may not:</p>
            <ul>
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations</li>
                <li>Transfer the materials to another person</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
                When you create an account with us, you must provide accurate, complete, and current
                information at all times. Failure to do so constitutes a breach of the Terms.
            </p>
            <p>
                You are responsible for safeguarding the password and for all activities under your account.
            </p>

            <h2>4. Prohibited Uses</h2>
            <p>You may not use SpendSync:</p>
            <ul>
                <li>In any way that violates applicable laws or regulations</li>
                <li>To transmit malicious code or viruses</li>
                <li>To engage in unauthorized framing or linking</li>
                <li>To impersonate or attempt to impersonate others</li>
                <li>To interfere with any other party's use of the service</li>
            </ul>

            <h2>5. Service Availability</h2>
            <p>
                We do not guarantee that the service will be available at all times. We may experience
                hardware, software, or other problems that could lead to interruptions, delays, or errors.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
                In no event shall SpendSync, nor its directors, employees, partners, or suppliers be liable
                for any indirect, incidental, special, consequential or punitive damages, including loss of
                profits, data, or other intangible losses.
            </p>

            <h2>7. Changes to Terms</h2>
            <p>
                We reserve the right to modify or replace these Terms at any time. We will provide notice
                of any changes by posting the new Terms on this page.
            </p>

            <h2>8. Contact</h2>
            <p>
                If you have any questions about these Terms, please contact us at terms@spendsync.app
            </p>
        </StaticPageTemplate>
    );
};

export default TermsOfServicePage;
