import { motion } from 'framer-motion';

export default function AnimatedRevealText({
    text,
    delay = 0,
    className = ''
}: {
    text: string,
    delay?: number,
    className?: string
}) {
    const words = text.split(" ");

    return (
        <span className={`inline-flex flex-wrap overflow-hidden ${className}`}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-2 relative pb-2 leading-tight">
                    <motion.span
                        className="inline-block origin-bottom-left"
                        initial={{ y: "100%", rotate: 8, opacity: 0 }}
                        whileInView={{ y: 0, rotate: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1], // expo out curve
                            delay: delay + i * 0.05
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}
